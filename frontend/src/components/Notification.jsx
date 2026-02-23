// src/components/Notification.jsx
const Notification = ({ message, type }) => {
    if (!message) return null;
  
    const base = "p-4 mb-4 text-sm rounded-md text-white text-center";
    const styles = {
      success: `${base} bg-green-700`,
      error: `${base} bg-red-700`,
      info: `${base} bg-blue-700`,
    };
  
    return (
      <div className={styles[type] || styles.info}>
        {message}
      </div>
    );
  };
  
  export default Notification;