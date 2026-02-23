// src/utils/fetchAuthorImage.js

export async function fetchAuthorImage(authorName) {
    try {
      const formattedName = authorName.replace(/\s+/g, "_"); // Înlocuim spațiile cu subliniere
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formattedName}`);
      if (!response.ok) {
        throw new Error('No image found');
      }
      const data = await response.json();
      return data.thumbnail ? data.thumbnail.source : null;
    } catch (error) {
      console.error("Error fetching author image:", error);
      return null;
    }
  }