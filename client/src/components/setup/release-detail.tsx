import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  type Release,
  type InsertRelease,
  insertReleaseSchema,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Edit, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const releaseFormSchema = insertReleaseSchema.extend({
  order: z.number().min(1, "Order must be a positive number"),
});

type ReleaseForm = z.infer<typeof releaseFormSchema>;

const statusColors = {
  Planned: "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Dropped: "bg-red-100 text-red-800",
};

interface ReleaseDetailProps {
  release: Release;
}

export default function ReleaseDetail({ release }: ReleaseDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ReleaseForm>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      releaseName: "",
      releaseDescription: "",
      order: 1,
      commits: "",
      status: "Planned",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ReleaseForm) => {
      return apiRequest("PATCH", `/api/releases/${release.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({
        title: "Release updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update release",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReleaseForm) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (release) {
      form.reset({
        releaseName: release.releaseName || "",
        releaseDescription: release.releaseDescription ?? "",
        order: release.order || 1,
        commits: release.commits ?? "",
        status: release.status as any || "Planned",
      });
    }
  };

  useEffect(() => {
    if (release) {
      form.reset({
        releaseName: release.releaseName || "",
        releaseDescription: release.releaseDescription ?? "",
        order: release.order || 1,
        commits: release.commits ?? "",
        status: release.status as any || "Planned",
      });
    }
  }, [release, form]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Release Detail View</CardTitle>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel-edit-release"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-edit-release"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-release"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="releaseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Release Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter release name"
                        data-testid="input-edit-release-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="releaseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={3}
                        placeholder="Enter release description"
                        className="resize-none"
                        data-testid="input-edit-release-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Order <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        placeholder="Enter order number"
                        data-testid="input-edit-release-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commits</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={4}
                        placeholder="Enter commit information"
                        className="resize-none"
                        data-testid="input-edit-release-commits"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      data-testid="select-edit-release-status"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Release Name
              </label>
              <div
                className="mt-1 text-foreground font-medium"
                data-testid="text-release-name-value"
              >
                {release.releaseName}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Release Description
              </label>
              <div
                className="mt-1 text-foreground whitespace-pre-wrap"
                data-testid="text-release-description-value"
              >
                {release.releaseDescription || "No description provided"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Order
              </label>
              <div
                className="mt-1 text-foreground"
                data-testid="text-release-order-value"
              >
                {release.order}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <Badge
                  className={statusColors[release.status as keyof typeof statusColors]}
                  data-testid="badge-release-status-value"
                >
                  {release.status}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Commits
              </label>
              <div
                className="mt-1 text-foreground whitespace-pre-wrap"
                data-testid="text-release-commits-value"
              >
                {release.commits || "No commits provided"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created Date
              </label>
              <div
                className="mt-1 text-foreground"
                data-testid="text-release-created-date-value"
              >
                {release.createdDate
                  ? new Date(release.createdDate).toLocaleString()
                  : "Not available"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
