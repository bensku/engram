import { signal } from '@preact/signals';

export const Snackbar = () => {
  const dismissAlert = (id: string) => {
    activeAlerts.value = activeAlerts.peek().filter((alert) => alert.id != id);
  };

  return (
    <>
      {activeAlerts.value.map((alert) => (
        <div
          key={alert.id}
          class={`snackbar top active ${
            alert.kind == 'error' ? 'error' : 'primary'
          }`}
          onClick={() => dismissAlert(alert.id)}
        >
          {alert.message}
        </div>
      ))}
    </>
  );
};

export function showAlert(
  kind: Alert['kind'],
  message: string,
  duration = 8_000,
) {
  const alert = { id: `${Math.random()}`, kind, message };
  activeAlerts.value = [...activeAlerts.peek(), alert]; // Show alert
  setTimeout(() => {
    // Clear that particular alert
    activeAlerts.value = activeAlerts.peek().filter((a) => a != alert);
  }, duration);
}

interface Alert {
  id: string;
  kind: 'info' | 'error';
  message: string;
}

export const activeAlerts = signal<Alert[]>([]);
