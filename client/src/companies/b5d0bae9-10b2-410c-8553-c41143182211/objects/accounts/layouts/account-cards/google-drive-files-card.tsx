import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HardDrive, 
  Upload, 
  FileIcon, 
  Folder, 
  Trash2, 
  ExternalLink, 
  Link, 
  Unlink, 
  Loader2, 
  RefreshCw,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FolderPlus
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

interface DriveFilesResponse {
  files: DriveFile[];
  folderId: string | null;
  folderNotCreated?: boolean;
}

interface GoogleConnectionStatus {
  connected: boolean;
  email: string | null;
}

interface GoogleDriveFilesCardProps {
  accountId: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-4 w-4" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-4 w-4" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) 
    return <FileSpreadsheet className="h-4 w-4" />;
  if (mimeType.includes("document") || mimeType.includes("word") || mimeType === "application/pdf") 
    return <FileText className="h-4 w-4" />;
  if (mimeType === "application/vnd.google-apps.folder") 
    return <Folder className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "";
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GoogleDriveFilesCard({ accountId }: GoogleDriveFilesCardProps) {
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: googleStatus, isLoading: isLoadingStatus } = useQuery<GoogleConnectionStatus>({
    queryKey: ["/api/integrations/google/status"],
  });

  const { data: filesData, isLoading: isLoadingFiles, refetch: refetchFiles } = useQuery<DriveFilesResponse>({
    queryKey: ["/api/integrations/google/drive/account", accountId, "files"],
    enabled: googleStatus?.connected === true,
  });

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const currentUrl = window.location.pathname;
      const response = await apiRequest("GET", `/api/integrations/google/oauth/start?returnUrl=${encodeURIComponent(currentUrl)}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start Google authentication",
        variant: "destructive",
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/integrations/google/drive/account/${accountId}/ensure-folder`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/integrations/google/drive/account", accountId, "files"] 
      });
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ fileName, fileContent, mimeType }: { fileName: string; fileContent: string; mimeType: string }) => {
      const response = await apiRequest("POST", `/api/integrations/google/drive/account/${accountId}/upload`, {
        fileName,
        fileContent,
        mimeType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/integrations/google/drive/account", accountId, "files"] 
      });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest("DELETE", `/api/integrations/google/drive/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/integrations/google/drive/account", accountId, "files"] 
      });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      setFileToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFileMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
  };

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Drive Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!googleStatus?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Drive Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Unlink className="h-5 w-5" />
              <span>Connect to Google Drive to manage files</span>
            </div>
            <Button
              type="button"
              onClick={() => connectGoogleMutation.mutate()}
              disabled={connectGoogleMutation.isPending}
              data-testid="button-connect-google-drive"
            >
              {connectGoogleMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link className="h-4 w-4 mr-2" />
              )}
              Connect Google Drive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filesData?.folderNotCreated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Drive Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Folder className="h-5 w-5" />
              <span>No folder created for this account yet</span>
            </div>
            <Button
              type="button"
              onClick={() => createFolderMutation.mutate()}
              disabled={createFolderMutation.isPending}
              data-testid="button-create-folder"
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4 mr-2" />
              )}
              Create Folder
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Google Drive Files
        </CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetchFiles()}
            disabled={isLoadingFiles}
            data-testid="button-refresh-files"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? "animate-spin" : ""}`} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-upload"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadFileMutation.isPending}
            data-testid="button-upload-file"
          >
            {uploadFileMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingFiles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filesData?.files && filesData.files.length > 0 ? (
          <div className="space-y-2">
            {filesData.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                data-testid={`drive-file-${file.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-muted-foreground">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(file.modifiedTime)}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {file.webViewLink && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      asChild
                      data-testid={`button-open-file-${file.id}`}
                    >
                      <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFileToDelete(file)}
                    data-testid={`button-delete-file-${file.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileIcon className="h-8 w-8 mb-2" />
            <p>No files yet</p>
            <p className="text-sm">Upload files using the button above</p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && deleteFileMutation.mutate(fileToDelete.id)}
              disabled={deleteFileMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteFileMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
