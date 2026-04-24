import { useEffect } from 'react';

interface Props {
  message: string;
}

export default function SessionStatusNotice({ message }: Props) {
  useEffect(() => {
    const originalTitle = document.title;
    const alertTitle = `${message} | juego`;
    let showAlert = false;

    document.title = alertTitle;

    const intervalId = window.setInterval(() => {
      showAlert = !showAlert;
      document.title = showAlert ? alertTitle : originalTitle;
    }, 900);

    if ('vibrate' in navigator) {
      navigator.vibrate([180, 120, 180]);
    }

    return () => {
      window.clearInterval(intervalId);
      document.title = originalTitle;
    };
  }, [message]);

  return (
    <section
      style={{
        background: '#fff6df',
        border: '1px solid #f0dfac',
        borderRadius: 18,
        padding: 16,
        color: '#8a5b00',
        fontWeight: 700,
      }}
    >
      {message}
    </section>
  );
}
