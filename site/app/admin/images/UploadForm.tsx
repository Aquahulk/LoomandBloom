'use client';

import { useState } from 'react';
import { DisplayCategory } from '@prisma/client';

interface UploadFormProps {
  categories: DisplayCategory[];
}

export default function UploadForm({ categories }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Build form data from the form fields directly
      const fd = new FormData(e.currentTarget);
      // Attach the selected file under the expected key
      fd.append('image_0', file);

      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: fd,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      // Refresh the page to show the new image
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }
  
  return (
    <section className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Upload New Image</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              type="text" 
              name="title"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Image title"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            name="description"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Optional description"
            rows={2}
          />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              name="type"
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="HERO">Homepage Hero</option>
              <option value="BANNER">Banner</option>
              <option value="PROMO">Promo</option>
              <option value="LOGO">Logo</option>
              <option value="FRESH_PLANT">Fresh Plant</option>
              <option value="ABOUT_US">About Us</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
            <select 
              name="categoryId"
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">None</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language (Optional)</label>
            <select 
              name="locale"
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isUploading || !file}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </form>
    </section>
  );
}