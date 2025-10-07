'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityTag as ActivityTagType } from '@/hooks/use-tags-queries';
import { useRemoveTagFromActivity } from '@/hooks/use-tags-queries';
import { toast } from 'sonner';

interface ActivityTagProps {
  activityTag: ActivityTagType;
  activityId: string;
  showRemove?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function ActivityTag({ 
  activityTag, 
  activityId, 
  showRemove = false,
  size = 'default'
}: ActivityTagProps) {
  const removeTagMutation = useRemoveTagFromActivity();

  const handleRemove = async () => {
    try {
      await removeTagMutation.mutateAsync({
        activityId,
        tagId: activityTag.tag_id,
      });
      toast.success('Tag removed successfully');
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1 px-2 py-1 text-white font-medium',
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1.5'
      )}
      style={{
        backgroundColor: activityTag.tag.color,
        color: 'white',
      }}
    >
      <span className="text-xs">
        {activityTag.tag.icon}
      </span>
      <span>{activityTag.tag.name}</span>
      {activityTag.is_auto_generated && (
        <span 
          className="text-xs opacity-75" 
          title="Automatically generated tag"
        >
          🤖
        </span>
      )}
      {showRemove && !activityTag.is_auto_generated && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 hover:bg-white/20"
          onClick={handleRemove}
          disabled={removeTagMutation.isPending}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
} 