
import { useState, useEffect, useRef } from "react";
import { OrderCommunication } from "@/services/order/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, UserCog } from "lucide-react";

interface OrderCommunicationPanelProps {
  orderId: string;
  communications: OrderCommunication[];
  isAdmin?: boolean;
  onSendMessage?: (orderId: string, message: string) => void;
  doctorId?: string;
  doctorName?: string;
}

const OrderCommunicationPanel = ({
  orderId,
  communications,
  isAdmin = false,
  onSendMessage,
  doctorId = "",
  doctorName = "Doctor"
}: OrderCommunicationPanelProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [communications]);
  
  const handleSendMessage = () => {
    if (!message.trim() || !onSendMessage) return;
    
    onSendMessage(orderId, message);
    setMessage("");
  };
  
  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {isAdmin ? `Messages with ${doctorName}` : 'Messages with Admin'}
        </CardTitle>
        <CardDescription>
          Communicate about this order
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pb-0">
        <div className="space-y-4">
          {communications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 italic">No messages yet</p>
            </div>
          ) : (
            communications.map((comm) => {
              const isCurrentUser = isAdmin 
                ? comm.sender_type === 'admin'
                : comm.sender_id === user?.id;
              
              return (
                <div 
                  key={comm.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isCurrentUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!isCurrentUser && (
                        <>
                          {isAdmin ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <UserCog className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium">
                            {isAdmin ? doctorName : 'Admin'}
                          </span>
                        </>
                      )}
                      <span className="text-xs opacity-70 ml-auto">
                        {new Date(comm.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-line">{comm.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full gap-2">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none"
            rows={2}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || !onSendMessage}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderCommunicationPanel;
