import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, Radio } from 'lucide-react';
import { useAppStore } from '../store';

export function Toasts() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[120] flex w-[340px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3 shadow-pop"
          >
            <span className={t.kind === 'success' ? 'mt-0.5 text-emerald-500' : t.kind === 'realtime' ? 'mt-0.5 text-accent' : 'mt-0.5 text-ink3'}>
              {t.kind === 'success' ? <CheckCircle2 className="h-4 w-4" /> : t.kind === 'realtime' ? <Radio className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink2">{t.body}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-[10px] font-medium text-ink3 hover:text-ink cursor-pointer">
              Dismiss
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
