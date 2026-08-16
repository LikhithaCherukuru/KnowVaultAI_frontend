import {
  FileText,
  File as FileIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  FileCode,
  FileArchive,
  Music,
  Video,
  FileType,
} from 'lucide-react';
import type { FileCategory } from '@/types';
import { cn } from '@/utils';

interface FileIconProps {
  category: FileCategory;
  className?: string;
}

const iconMap: Record<FileCategory, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: 'text-red-500' },
  doc: { icon: FileText, color: 'text-blue-500' },
  txt: { icon: FileText, color: 'text-gray-500' },
  image: { icon: ImageIcon, color: 'text-emerald-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-600' },
  presentation: { icon: Presentation, color: 'text-orange-500' },
  code: { icon: FileCode, color: 'text-purple-500' },
  audio: { icon: Music, color: 'text-pink-500' },
  video: { icon: Video, color: 'text-indigo-500' },
  archive: { icon: FileArchive, color: 'text-amber-600' },
  other: { icon: FileType, color: 'text-gray-400' },
};

export function FileIconComponent({ category, className }: FileIconProps) {
  const { icon: Icon, color } = iconMap[category] || iconMap.other;
  return <Icon className={cn('w-5 h-5', color, className)} />;
}
