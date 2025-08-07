import React from 'react';
import { User } from 'lucide-react';

const ProfilePage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
        <p className="text-gray-600 mb-6">
          Manage your profile and learning preferences
        </p>
        <p className="text-sm text-gray-500">
          Profile management interface coming soon.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;