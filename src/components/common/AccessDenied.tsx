import React from 'react';
import { ShieldBan, Lock, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  roleName?: string | null;
  requiredPermission?: string | null;
  permissionLabel?: string | null;
  onBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  roleName,
  requiredPermission,
  permissionLabel,
  onBack,
}) => {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldBan className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-red-900 tracking-tight">Access Denied</h2>
            <p className="text-xs text-red-700 mt-0.5">
              Your current role does not grant access to this area.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2.5 text-xs">
            <Lock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600 space-y-1">
              {roleName && (
                <p>
                  Role: <span className="font-mono font-semibold text-gray-900">{roleName}</span>
                </p>
              )}
              {requiredPermission && (
                <p>
                  Required permission:{' '}
                  <span className="font-mono font-semibold text-red-700">
                    {permissionLabel ?? requiredPermission}
                  </span>
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Contact your System Administrator if you believe this is a mistake or want to request
            elevated privileges.
          </p>

          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};