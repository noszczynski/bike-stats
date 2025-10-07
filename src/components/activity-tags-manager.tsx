'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, RefreshCw, Tag as TagIcon } from 'lucide-react';
import { ActivityTag } from './activity-tag';
import { 
  useGetActivityTags, 
  useGetAllTags, 
  useAddTagToActivity, 
  useReapplyAutoTags 
} from '@/hooks/use-tags-queries';
import { toast } from 'sonner';

interface ActivityTagsManagerProps {
  activityId: string;
  showInline?: boolean;
  className?: string;
}

export function ActivityTagsManager({ 
  activityId, 
  showInline = true,
  className 
}: ActivityTagsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>('');

  const { data: activityTags = [], isLoading: isLoadingActivityTags } = useGetActivityTags(activityId);
  const { data: allTags = [], isLoading: isLoadingAllTags } = useGetAllTags();
  const addTagMutation = useAddTagToActivity();
  const reapplyAutoTagsMutation = useReapplyAutoTags();

  // Filter out tags that are already added to the activity
  const availableTags = allTags.filter(
    tag => !activityTags.some(activityTag => activityTag.tag_id === tag.id)
  );

  const handleAddTag = async () => {
    if (!selectedTagId) return;

    try {
      await addTagMutation.mutateAsync({
        activityId,
        tagId: selectedTagId,
      });
      toast.success('Tag added successfully');
      setSelectedTagId('');
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleReapplyAutoTags = async () => {
    try {
      await reapplyAutoTagsMutation.mutateAsync(activityId);
      toast.success('Auto tags reapplied successfully');
    } catch (error) {
      toast.error('Failed to reapply auto tags');
    }
  };

  if (isLoadingActivityTags) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  const TagsDisplay = () => (
    <div className="flex flex-wrap gap-2">
      {activityTags.map((activityTag) => (
        <ActivityTag
          key={activityTag.id}
          activityTag={activityTag}
          activityId={activityId}
          showRemove={true}
          size="default"
        />
      ))}
    </div>
  );

  const ActionsSection = () => (
    <div className="flex items-center gap-2">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Tag
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTagId} onValueChange={setSelectedTagId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag to add" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAllTags ? (
                  <SelectItem value="loading" disabled>
                    Loading tags...
                  </SelectItem>
                ) : availableTags.length === 0 ? (
                  <SelectItem value="no-tags" disabled>
                    No available tags
                  </SelectItem>
                ) : (
                  availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={handleAddTag}
                disabled={!selectedTagId || addTagMutation.isPending}
              >
                {addTagMutation.isPending ? 'Adding...' : 'Add Tag'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReapplyAutoTags}
        disabled={reapplyAutoTagsMutation.isPending}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        {reapplyAutoTagsMutation.isPending ? 'Applying...' : 'Reapply Auto Tags'}
      </Button>
    </div>
  );

  if (showInline) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Tags</span>
          </div>
          <ActionsSection />
        </div>
        {activityTags.length > 0 ? (
          <TagsDisplay />
        ) : (
          <div className="text-sm text-muted-foreground">No tags added</div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          Activity Tags
        </h3>
        <ActionsSection />
      </div>
      <Separator />
      {activityTags.length > 0 ? (
        <TagsDisplay />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tags added to this activity</p>
          <p className="text-sm">Add tags to organize and categorize your training</p>
        </div>
      )}
    </div>
  );
} 