import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, inviteUserByEmail } = vi.hoisted(() => ({
  getUser: vi.fn(),
  inviteUserByEmail: vi.fn(),
}))

vi.mock('../../config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser,
    },
  },
}))

vi.mock('../../config/supabase-admin.js', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        inviteUserByEmail,
      },
    },
  },
}))

import app from '../../app.js'
import { prisma } from '../../config/prisma.js'

type FixtureUser = {
  id: string
  email: string
}

type Fixture = {
  owner: FixtureUser
  admin: FixtureUser
  member: FixtureUser
  outsider: FixtureUser
  workspaceA: string
  workspaceB: string
  projectA: string
  projectB: string
  taskA: string
  taskB: string
  labelA: string
}

let fixture: Fixture
const createdWorkspaceIds: string[] = []

function authAs(user: FixtureUser) {
  getUser.mockResolvedValue({
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {},
      },
    },
    error: null,
  })
}

function authAsToken(token: string) {
  getUser.mockImplementation(async (receivedToken: string) => {
    if (receivedToken !== token) {
      return {
        data: { user: null },
        error: new Error('Invalid token'),
      }
    }

    return {
      data: {
        user: {
          id: fixture.owner.id,
          email: fixture.owner.email,
          user_metadata: {},
        },
      },
      error: null,
    }
  })
}

async function createFixtureUser(role: string): Promise<FixtureUser> {
  const user = {
    id: `integration-${role.toLowerCase()}-${randomUUID()}`,
    email: `${role.toLowerCase()}-${randomUUID()}@example.test`,
  }

  await prisma.user.create({ data: user })
  return user
}

beforeAll(async () => {
  const [owner, admin, member, outsider] = await Promise.all([
    createFixtureUser('owner'),
    createFixtureUser('admin'),
    createFixtureUser('member'),
    createFixtureUser('outsider'),
  ])

  const workspaceA = await prisma.workspace.create({
    data: {
      name: `Integration Workspace A ${randomUUID()}`,
      slug: `integration-a-${randomUUID()}`,
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  })

  const workspaceB = await prisma.workspace.create({
    data: {
      name: `Integration Workspace B ${randomUUID()}`,
      slug: `integration-b-${randomUUID()}`,
      members: {
        create: { userId: outsider.id, role: 'OWNER' },
      },
    },
  })

  createdWorkspaceIds.push(workspaceA.id, workspaceB.id)

  const [projectA, projectB] = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Project A',
        slug: `project-a-${randomUUID()}`,
        workspaceId: workspaceA.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Project B',
        slug: `project-b-${randomUUID()}`,
        workspaceId: workspaceB.id,
      },
    }),
  ])

  const [taskA, taskB] = await Promise.all([
    prisma.task.create({
      data: { title: 'Task A', projectId: projectA.id },
    }),
    prisma.task.create({
      data: { title: 'Task B', projectId: projectB.id },
    }),
  ])

  const labelA = await prisma.label.create({
    data: { name: `Label A ${randomUUID()}`, workspaceId: workspaceA.id },
  })

  await prisma.taskActivity.create({
    data: {
      taskId: taskA.id,
      projectId: projectA.id,
      actorId: owner.id,
      type: 'TASK_CREATED',
      details: { source: 'integration-test' },
    },
  })

  fixture = {
    owner,
    admin,
    member,
    outsider,
    workspaceA: workspaceA.id,
    workspaceB: workspaceB.id,
    projectA: projectA.id,
    projectB: projectB.id,
    taskA: taskA.id,
    taskB: taskB.id,
    labelA: labelA.id,
  }
})

beforeEach(() => {
  getUser.mockReset()
  inviteUserByEmail.mockResolvedValue({ data: {}, error: null })
})

afterAll(async () => {
  await prisma.workspace.deleteMany({
    where: { id: { in: createdWorkspaceIds } },
  })
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [
          fixture.owner.id,
          fixture.admin.id,
          fixture.member.id,
          fixture.outsider.id,
        ],
      },
    },
  })
  await prisma.$disconnect()
})

describe('authenticated API access', () => {
  it('rejects missing and invalid tokens', async () => {
    await request(app).get('/api/v1/workspaces').expect(401)

    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token'),
    })

    await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)
  })

  it('uses the verified identity instead of a request-body user ID', async () => {
    authAs(fixture.owner)

    const response = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', 'Bearer owner-token')
      .send({
        name: `Identity Test ${randomUUID()}`,
        userId: fixture.outsider.id,
      })
      .expect(201)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: fixture.owner.id,
          workspaceId: response.body.workspace.id,
        },
      },
    })

    expect(membership?.role).toBe('OWNER')
    createdWorkspaceIds.push(response.body.workspace.id)
  })
})

describe('workspace RBAC and isolation', () => {
  it('allows owners to change roles but rejects member self-escalation', async () => {
    authAs(fixture.owner)
    await request(app)
      .patch(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.member.id}`)
      .set('Authorization', 'Bearer owner-token')
      .send({ role: 'ADMIN' })
      .expect(200)

    authAs(fixture.member)
    await request(app)
      .patch(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.member.id}`)
      .set('Authorization', 'Bearer member-token')
      .send({ role: 'ADMIN' })
      .expect(403)

    authAs(fixture.owner)
    await request(app)
      .patch(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.member.id}`)
      .set('Authorization', 'Bearer owner-token')
      .send({ role: 'MEMBER' })
      .expect(200)
  })

  it('rejects admin owner-only role changes and member management', async () => {
    authAs(fixture.admin)

    await request(app)
      .patch(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.owner.id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ role: 'ADMIN' })
      .expect(403)

    await request(app)
      .delete(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.member.id}`)
      .set('Authorization', 'Bearer admin-token')
      .expect(200)

    authAs(fixture.member)
    await request(app)
      .delete(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.admin.id}`)
      .set('Authorization', 'Bearer member-token')
      .expect(403)
  })

  it('allows admins to invite members but not administrators', async () => {
    authAs(fixture.admin)

    await request(app)
      .post(`/api/v1/workspaces/${fixture.workspaceA}/invites`)
      .set('Authorization', 'Bearer admin-token')
      .send({ email: `admin-invite-${randomUUID()}@example.test`, role: 'ADMIN' })
      .expect(403)

    await request(app)
      .post(`/api/v1/workspaces/${fixture.workspaceA}/invites`)
      .set('Authorization', 'Bearer admin-token')
      .send({ email: `member-invite-${randomUUID()}@example.test`, role: 'MEMBER' })
      .expect(201)

    authAs(fixture.owner)
    await request(app)
      .post(`/api/v1/workspaces/${fixture.workspaceA}/invites`)
      .set('Authorization', 'Bearer owner-token')
      .send({ email: `owner-invite-${randomUUID()}@example.test`, role: 'ADMIN' })
      .expect(201)
  })

  it('rejects non-member access to workspace resources', async () => {
    authAs(fixture.outsider)

    await request(app)
      .get(`/api/v1/workspaces/${fixture.workspaceA}/members`)
      .set('Authorization', 'Bearer outsider-token')
      .expect(403)

    await request(app)
      .get(`/api/v1/workspaces/${fixture.workspaceA}/projects`)
      .set('Authorization', 'Bearer outsider-token')
      .expect(403)
  })

  it('isolates projects, tasks, labels, assignments, and activity', async () => {
    authAs(fixture.owner)

    await request(app)
      .get(`/api/v1/workspaces/${fixture.workspaceB}/projects`)
      .set('Authorization', 'Bearer owner-token')
      .expect(403)

    await request(app)
      .get(`/api/v1/projects/${fixture.projectB}/tasks`)
      .set('Authorization', 'Bearer owner-token')
      .expect(403)

    await request(app)
      .get(`/api/v1/tasks/${fixture.taskB}/activity`)
      .set('Authorization', 'Bearer owner-token')
      .expect(404)

    await request(app)
      .put(`/api/v1/tasks/${fixture.taskB}/labels`)
      .set('Authorization', 'Bearer owner-token')
      .send({ labelIds: [fixture.labelA] })
      .expect(403)

    await request(app)
      .put(`/api/v1/tasks/${fixture.taskB}/assignees`)
      .set('Authorization', 'Bearer owner-token')
      .send({ userIds: [fixture.owner.id] })
      .expect(403)
  })

  it('rejects changing another user membership', async () => {
    authAs(fixture.member)

    await request(app)
      .patch(`/api/v1/workspaces/${fixture.workspaceA}/members/${fixture.admin.id}`)
      .set('Authorization', 'Bearer member-token')
      .send({ role: 'MEMBER' })
      .expect(403)
  })
})

describe('authentication token identity', () => {
  it('accepts only the token mapped by the authentication boundary', async () => {
    authAsToken('verified-owner-token')

    await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', 'Bearer verified-owner-token')
      .expect(200)

    await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', 'Bearer owner-token')
      .expect(401)
  })
})
