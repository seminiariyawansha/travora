// src/services/cloudinaryService.js
const CLOUD_NAME = "c4re3ils";
const UPLOAD_PRESET = "ml_default";

// resourceType: "image" or "video"
export async function uploadToCloudinary(localUri, resourceType = "image") {
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    type: resourceType === "video" ? "video/mp4" : "image/jpeg",
    name: resourceType === "video" ? "upload.mp4" : "upload.jpg",
  });
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
}
