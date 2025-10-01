import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Languages as TranslationIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Translation, InsertTranslation, Language } from "@shared/schema";
import { insertTranslationSchema } from "@shared/schema";

type TranslationForm = z.infer<typeof insertTranslationSchema>;

function TranslationEditDialog({
  translation,
  onClose,
}: {
  translation: Translation;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  const form = useForm<TranslationForm>({
    resolver: zodResolver(insertTranslationSchema),
    defaultValues: {
      labelCode: translation.labelCode || "",
      labelContent: translation.labelContent || "",
      languageCode: translation.languageCode || "",
    },
  });

  const updateTranslationMutation = useMutation({
    mutationFn: async (data: TranslationForm) => {
      return await apiRequest("PATCH", `/api/translations/${translation.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
      toast({
        title: "Success",
        description: "Translation updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update translation",
      });
    },
  });

  const onSubmit = (data: TranslationForm) => {
    updateTranslationMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Translation</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="labelCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., WELCOME_MESSAGE, BUTTON_SAVE"
                    {...field}
                    data-testid="input-label-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labelContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label Content</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Welcome to our app, Save"
                    {...field}
                    data-testid="input-label-content"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="languageCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Code</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-language-code">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem
                        key={language.id}
                        value={language.languageCode}
                        data-testid={`option-language-${language.languageCode}`}
                      >
                        {language.languageCode} - {language.languageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTranslationMutation.isPending}
              data-testid="button-update-translation"
            >
              {updateTranslationMutation.isPending ? "Updating..." : "Update Translation"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function TranslationCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  const form = useForm<TranslationForm>({
    resolver: zodResolver(insertTranslationSchema),
    defaultValues: {
      labelCode: "",
      labelContent: "",
      languageCode: "",
    },
  });

  const createTranslationMutation = useMutation({
    mutationFn: async (data: TranslationForm) => {
      return await apiRequest("POST", "/api/translations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
      toast({
        title: "Success",
        description: "Translation created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create translation",
      });
    },
  });

  const onSubmit = (data: TranslationForm) => {
    createTranslationMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Translation</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="labelCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., WELCOME_MESSAGE, BUTTON_SAVE"
                    {...field}
                    data-testid="input-label-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labelContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label Content</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Welcome to our app, Save"
                    {...field}
                    data-testid="input-label-content"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="languageCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Code</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-language-code">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem
                        key={language.id}
                        value={language.languageCode}
                        data-testid={`option-language-${language.languageCode}`}
                      >
                        {language.languageCode} - {language.languageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTranslationMutation.isPending}
              data-testid="button-create-translation"
            >
              {createTranslationMutation.isPending ? "Creating..." : "Create Translation"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function TranslationsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [isCreatingTranslation, setIsCreatingTranslation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: translations = [], isLoading } = useQuery<Translation[]>({
    queryKey: ["/api/translations"],
  });

  const deleteTranslationMutation = useMutation({
    mutationFn: (translationId: string) => apiRequest("DELETE", `/api/translations/${translationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
      toast({
        title: "Success",
        description: "Translation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete translation",
      });
    },
  });

  const filteredTranslations = translations.filter((translation: Translation) => {
    const query = searchQuery.toLowerCase();
    return (
      translation.labelCode?.toLowerCase().includes(query) ||
      translation.labelContent?.toLowerCase().includes(query) ||
      translation.languageCode?.toLowerCase().includes(query)
    );
  });

  const handleDeleteTranslation = (translationId: string) => {
    deleteTranslationMutation.mutate(translationId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Translations</h3>
            <p className="text-sm text-muted-foreground">
              Manage translation labels and content
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading translations...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Translations</h3>
          <p className="text-sm text-muted-foreground">
            Manage translation labels and content
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingTranslation(true)}
          data-testid="button-create-translation"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Translation
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by label code, content, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-translation-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Translations List */}
      <Card>
        <CardHeader>
          <CardTitle>Translations ({filteredTranslations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTranslations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TranslationIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? "No translations match your search"
                  : "No translations found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label Code</TableHead>
                  <TableHead>Label Content</TableHead>
                  <TableHead>Language Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTranslations
                  .sort((a, b) => a.labelCode.localeCompare(b.labelCode))
                  .map((translation: Translation) => (
                    <TableRow
                      key={translation.id}
                      data-testid={`row-translation-${translation.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TranslationIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span data-testid={`text-label-code-${translation.id}`}>
                            {translation.labelCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-label-content-${translation.id}`}>
                        {translation.labelContent}
                      </TableCell>
                      <TableCell data-testid={`text-language-code-${translation.id}`}>
                        {translation.languageCode}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTranslation(translation)}
                            data-testid={`button-edit-translation-${translation.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-translation-${translation.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Translation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{translation.labelCode} ({translation.languageCode})"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTranslation(translation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-translation-${translation.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {isCreatingTranslation && (
        <Dialog open={isCreatingTranslation} onOpenChange={setIsCreatingTranslation}>
          <TranslationCreateDialog onClose={() => setIsCreatingTranslation(false)} />
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingTranslation && (
        <Dialog open={!!editingTranslation} onOpenChange={() => setEditingTranslation(null)}>
          <TranslationEditDialog
            translation={editingTranslation}
            onClose={() => setEditingTranslation(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
