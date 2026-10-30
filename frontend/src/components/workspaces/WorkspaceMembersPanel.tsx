import { Shield, UserMinus, Users } from 'lucide-react'
import type { WorkspaceMember, WorkspaceRole } from '../../app/types'

type Props = {
  workspaceName?: string
  actorRole?: WorkspaceRole
  members: WorkspaceMember[]
  loading: boolean
  updating: boolean
  onRoleChange: (
    userId: string,
    role: 'ADMIN' | 'MEMBER',
  ) => Promise<unknown>
  onRemove: (member: WorkspaceMember) => Promise<unknown>
}

export default function WorkspaceMembersPanel({
  workspaceName,
  actorRole,
  members,
  loading,
  updating,
  onRoleChange,
  onRemove,
}: Props) {
  const isOwner = actorRole === 'OWNER'
  const isAdmin = actorRole === 'ADMIN'

  return (
    <section className="pt-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Workspace settings
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold">Members</h2>
          <p className="mt-1 text-sm text-quiet">
            People who can access {workspaceName || 'this workspace'}.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg border border-line bg-panel px-3 py-2 text-xs text-quiet">
          <Users size={15} />
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        {loading ? (
          <p className="p-5 text-sm text-quiet">Loading workspace members…</p>
        ) : members.length === 0 ? (
          <p className="p-5 text-sm text-quiet">
            No members found for this workspace.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {members.map((member) => {
              const isTargetOwner = member.role === 'OWNER'
              const canRemove =
                !isTargetOwner &&
                (isOwner || (isAdmin && member.role === 'MEMBER'))
              const displayName = member.displayName?.trim() || member.email

              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                      {(member.displayName || member.email)
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-quiet">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-quiet">
                      <Shield size={12} />
                      {member.role.toLowerCase()}
                    </span>

                    {isOwner && !isTargetOwner && (
                      <>
                        <label
                          className="sr-only"
                          htmlFor={`member-role-${member.id}`}
                        >
                          Role for {member.email}
                        </label>
                        <select
                          id={`member-role-${member.id}`}
                          value={member.role}
                          disabled={updating}
                          onChange={(event) => {
                            const role = event.target.value
                            if (role === 'ADMIN' || role === 'MEMBER') {
                              void onRoleChange(member.id, role)
                            }
                          }}
                          className="rounded-md border border-line bg-panel px-2 py-1.5 text-xs disabled:opacity-50"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </>
                    )}

                    {canRemove && (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => void onRemove(member)}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <UserMinus size={13} />
                        Remove
                      </button>
                    )}

                    {isTargetOwner && (
                      <span className="text-[11px] text-quiet">
                        Workspace owner
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-quiet">
        Owners can change roles and remove other members. Admins can remove
        regular members only. The workspace owner cannot be demoted or removed
        from this screen.
      </p>
    </section>
  )
}
