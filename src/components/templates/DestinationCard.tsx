import { motion } from "framer-motion";
import { ArrowUpRight, CalendarRange, Wallet } from "lucide-react";
import type { DestinationTemplate } from "../../data/destinationTemplates";

export function DestinationCard({ template, onSelect, index }: { template: DestinationTemplate; onSelect: () => void; index: number }) {
  return (
    <motion.button
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative h-80 shrink-0 snap-start overflow-hidden rounded-3xl text-left shadow-lift sm:h-96 sm:w-[380px] w-[85vw]"
    >
      <img
        src={template.coverImage}
        alt={template.destination}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <span className="mb-2 w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
          {template.country}
        </span>
        <h3 className="font-display text-2xl font-medium leading-tight sm:text-3xl">{template.destination}</h3>
        <p className="mt-1.5 text-sm text-white/85">{template.tagline}</p>
        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-white/80">
          <span className="flex items-center gap-1">
            <CalendarRange size={13} />
            {template.days} days
          </span>
          <span className="flex items-center gap-1">
            <Wallet size={13} />
            ~${template.avgDailyBudget}/day
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-coral-500 px-3 py-1.5 font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            Start trip <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
