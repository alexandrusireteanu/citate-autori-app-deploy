export const getShareUrls = (quote, author) => {
    const text = encodeURIComponent(`"${quote}" — ${author}`);
    return {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=&quote=${text}`,
    };
  };
  