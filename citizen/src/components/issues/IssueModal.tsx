import { Dialog } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Issue } from '@/integrations/supabase/types';

interface IssueModalProps {
  issue: Issue | null;
  onClose: () => void;
}

const IssueModal = ({ issue, onClose }: IssueModalProps) => {
  if (!issue) return null;

  return (
    <Dialog open={!!issue} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">
          <button
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold mb-2">{issue.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{issue.category}</p>

          {issue.description && (
            <p className="mb-4 text-gray-700">{issue.description}</p>
          )}

          {issue.latitude && issue.longitude && (
            <p className="mb-4 text-sm text-muted-foreground">
              Location: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
              Status: {issue.status || 'open'}
            </span>
            {issue.priority && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  issue.priority === 'urgent'
                    ? 'text-red-600 bg-red-50'
                    : issue.priority === 'high'
                    ? 'text-orange-600 bg-orange-50'
                    : issue.priority === 'medium'
                    ? 'text-yellow-600 bg-yellow-50'
                    : 'text-green-600 bg-green-50'
                }`}
              >
                Priority: {issue.priority}
              </span>
            )}
            {issue.users?.name && (
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                Reported by: {issue.users.name}
              </span>
            )}
          </div>

          {/* Images */}
          {issue.images?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {issue.images.map((img: any) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt="Issue"
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
