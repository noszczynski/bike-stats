import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Tag {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon: string;
    created_at: Date;
    updated_at: Date;
}

export interface ActivityTag {
    id: string;
    activity_id: string;
    tag_id: string;
    is_auto_generated: boolean;
    created_at: Date;
    tag: Tag;
}

export function useGetAllTags() {
    return useQuery({
        queryKey: ["tags"],
        queryFn: async (): Promise<Tag[]> => {
            const response = await fetch("/api/tags");
            if (!response.ok) {
                throw new Error("Failed to fetch tags");
            }
            return response.json();
        },
    });
}

export function useGetActivityTags(activityId: string) {
    return useQuery({
        queryKey: ["activity-tags", activityId],
        queryFn: async (): Promise<ActivityTag[]> => {
            const response = await fetch(`/api/trainings/${activityId}/tags`);
            if (!response.ok) {
                throw new Error("Failed to fetch activity tags");
            }
            return response.json();
        },
        enabled: !!activityId,
    });
}

export function useCreateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            tagData: Omit<Tag, "id" | "created_at" | "updated_at">,
        ): Promise<Tag> => {
            const response = await fetch("/api/tags", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(tagData),
            });

            if (!response.ok) {
                throw new Error("Failed to create tag");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] });
        },
    });
}

export function useAddTagToActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            activityId,
            tagId,
        }: {
            activityId: string;
            tagId: string;
        }): Promise<ActivityTag> => {
            const response = await fetch(`/api/trainings/${activityId}/tags`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tagId }),
            });

            if (!response.ok) {
                throw new Error("Failed to add tag to activity");
            }

            return response.json();
        },
        onSuccess: (_, { activityId }) => {
            queryClient.invalidateQueries({ queryKey: ["activity-tags", activityId] });
        },
    });
}

export function useRemoveTagFromActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            activityId,
            tagId,
        }: {
            activityId: string;
            tagId: string;
        }): Promise<void> => {
            const response = await fetch(`/api/trainings/${activityId}/tags/${tagId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to remove tag from activity");
            }
        },
        onSuccess: (_, { activityId }) => {
            queryClient.invalidateQueries({ queryKey: ["activity-tags", activityId] });
        },
    });
}

export function useReapplyAutoTags() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (activityId: string): Promise<void> => {
            const response = await fetch(`/api/trainings/${activityId}/tags/auto-reapply`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to reapply auto tags");
            }
        },
        onSuccess: (_, activityId) => {
            queryClient.invalidateQueries({ queryKey: ["activity-tags", activityId] });
        },
    });
}
