"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  MessageSquare, 
  Clock, 
  User, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  Loader2,
  ChevronRight,
  Filter,
  MoreVertical
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CustomRequest {
  id: string;
  topic: string;
  description: string;
  purpose: string;
  outcome: string;
  references: string;
  userId: string;
  userEmail: string;
  status: "pending" | "in-progress" | "completed";
  createdAt: any;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomRequest[];
      setRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "requests", id), { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selectedRequest?.id === id) setSelectedRequest(null);
    } catch (err) {
      console.error("Error deleting request:", err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Custom Requests</h1>
        <p className="text-muted-foreground font-medium mt-1 text-sm">Review and manage user-submitted kit requests.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Requests List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-muted-foreground">
              <Filter className="h-4 w-4" />
              Recent Submissions
            </h2>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
              {requests.length} Total
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Topic</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      </td>
                    </tr>
                  ) : requests.length > 0 ? requests.map((req) => (
                    <tr 
                      key={req.id} 
                      className={`hover:bg-muted/20 transition-colors group cursor-pointer ${selectedRequest?.id === req.id ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-xs truncate max-w-[150px]">{req.userEmail}</div>
                        <div className="text-[9px] text-muted-foreground font-mono">{req.userId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm line-clamp-1">{req.topic}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          req.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                          req.status === 'in-progress' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium text-xs">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                             className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                           >
                             <ChevronRight className="h-4 w-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                        No custom requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Request Details Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight text-muted-foreground px-1">
            <MessageSquare className="h-4 w-4" />
            Request Details
          </h2>
          
          {selectedRequest ? (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2 pb-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded ${
                    selectedRequest.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                    selectedRequest.status === 'in-progress' ? 'bg-blue-500/10 text-blue-600' :
                    'bg-amber-500/10 text-amber-600'
                  }`}>
                    {selectedRequest.status}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'in-progress')}
                      className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors text-blue-500"
                      title="Mark In Progress"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                      className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors text-green-500"
                      title="Mark Completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedRequest.id)}
                      className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-black leading-tight pt-2">{selectedRequest.topic}</h3>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <User className="h-3 w-3" />
                  {selectedRequest.userEmail}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                {selectedRequest.purpose && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Purpose</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedRequest.purpose}</p>
                  </div>
                )}

                {selectedRequest.outcome && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Desired Outcome</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedRequest.outcome}</p>
                  </div>
                )}

                {selectedRequest.references && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">References</h4>
                    <div className="space-y-2 mt-2">
                      {selectedRequest.references.split(',').map((ref, idx) => (
                        <a 
                          key={idx} 
                          href={ref.trim().startsWith('http') ? ref.trim() : `https://${ref.trim()}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/5 p-2 rounded-lg truncate"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {ref.trim()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border/50">
                 <button 
                  onClick={() => {
                    // This could open the Forge with pre-filled data in the future
                    alert("Forge integration coming soon!");
                  }}
                  className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-xs"
                 >
                   Forge Kit from Request
                   <ChevronRight className="h-4 w-4" />
                 </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center space-y-4">
              <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto opacity-30">
                <MessageSquare className="h-8 w-8" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select a request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
