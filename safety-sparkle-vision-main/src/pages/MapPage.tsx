import { SiteMap } from '@/components/SiteMap';
import { motion } from 'framer-motion';

export default function MapPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-[calc(100vh-3.5rem)]">
      <SiteMap />
    </motion.div>
  );
}
