"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ChatHistory } from "@/types";
import apiService from "@/lib/apiService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  isOpen: boolean;
  onOpenChange: (val: boolean) => void;
  chatId: string | null;
};

export default function ViewChatHistoryDialog({
  isOpen,
  onOpenChange,
  chatId,
}: Props) {
  const [chat, setChat] = useState<ChatHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (!chatId || chatId === lastLoadedId) return;
      setLoading(true);
      try {
        const response = await apiService<{
          success: boolean;
          data: ChatHistory;
        }>(`/chat-history/admin-or-user/${chatId}`);
        if (response.success) {
          setChat(response.data);
          setLastLoadedId(chatId);
        }
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchChat();
    }
  }, [chatId, isOpen, lastLoadedId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Chat Details</DialogTitle>
          <DialogDescription>
            Review all chat messages and metadata.
          </DialogDescription>
        </DialogHeader>

        {loading || !chat ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Title:</h3>
              <p>{chat.title}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>Total Messages: {chat.total_messages}</div>
              <div>Total Tokens: {chat.total_tokens_used}</div>
              {/* <div>Favorite: {chat.is_favorite ? "Yes" : "No"}</div>
              <div>Archived: {chat.is_archived ? "Yes" : "No"}</div> */}
              <div>User: {chat.user_id?.name || "Unknown"}</div>
              <div>Created: {format(new Date(chat.createdAt), "PPpp")}</div>
              <div>
                Last Activity: {format(new Date(chat.last_activity), "PPpp")}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Messages</h3>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <ul className="space-y-3 text-sm">
                  {chat.messages.map((msg) => (
                    <li key={msg._id} className="border-b pb-2">
                      <div className="font-semibold">
                        {msg.type === "user" ? "User" : "Assistant"}:
                      </div>
                      <div>{msg.content}</div>

                      {msg.type === "assistant" && msg.metadata && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {format(new Date(msg.timestamp), "PPpp")} • Tokens:{" "}
                          {msg.metadata.tokens_used ?? "-"} • Model:{" "}
                          {msg.metadata.model_used ?? "-"}
                        </div>
                      )}

                      {msg.type === "user" && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {format(new Date(msg.timestamp), "PPpp")}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
