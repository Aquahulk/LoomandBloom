'use client';

import { useState } from 'react';

interface DeleteButtonProps {
  id: string;
}

export default function DeleteButton({ id }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/display?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      // Refresh the page to update the list
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}