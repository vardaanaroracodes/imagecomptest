'use client'
import { useState } from 'react';
import React from 'react';

export default function Upload() {
  const [imagePreview, setImagePreview] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadSize, setUploadSize] = useState('');
  const [compressedSize, setCompressedSize] = useState('');

  const previewImage = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      const imgSize = (file.size / 1024).toFixed(2) + ' KB';
      setUploadSize(imgSize);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setUploadSize('');
    }
  };

  const uploadImage = async () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Image = reader.result.split(',')[1];
      
      try {
        setLoading(true);

        const response = await fetch('https://ld29ebf44d.execute-api.ap-south-1.amazonaws.com/testprod/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ image: base64Image })
        });
        
        const data = await response.json();
        const parsedBody = JSON.parse(data.body);
        setResponseMessage(parsedBody.message);
        setKey(parsedBody.key);

        // Set the uploaded image URL
        const imageUrl = `https://imgcompstorage.s3.ap-south-1.amazonaws.com/${parsedBody.key}`;
        setUploadedImageUrl(imageUrl);

        // Calculate the compressed image size
        const compressedImage = await fetch(imageUrl);
        if (!compressedImage.ok) {
          throw new Error(`Error fetching compressed image! Status: ${compressedImage.status}`);
        }
        const compressedBlob = await compressedImage.blob();
        setCompressedSize((compressedBlob.size / 1024).toFixed(2) + ' KB');

        console.log(`Compressed image key: ${parsedBody.key}`);
      } catch (error) {
        setResponseMessage(`Error: ${error.message}`);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Upload and Compress Image</h1>
      <input type="file" id="imageInput" accept="image/*" onChange={previewImage} className="mb-4" />
      <button 
        onClick={uploadImage} 
        className={`bg-green-500 text-white py-2 px-4 rounded ${loading ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-green-700'}`} 
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>

      <div className="flex flex-row mt-8">
        <div className="flex flex-col items-center mr-8">
          {imagePreview && (
            <>
              <img id="imagePreview" src={imagePreview} alt="Image Preview" className="max-w-xs max-h-xs" />
              <p className="mt-2 text-gray-700">Upload Size: {uploadSize}</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center">
          {uploadedImageUrl && (
            <>
              <img id="uploadedImage" src={uploadedImageUrl} alt="Compressed Image" className="max-w-xs max-h-xs" />
             
            </>
          )}
        </div>
      </div>

      {responseMessage && (
        <p id="responseMessage" className="mt-4 text-gray-700">{responseMessage}</p>
      )}

      {key && (
        <p id="key" className="mt-2 text-gray-700">Key: {key}</p>
      )}
    </div>
  );
}