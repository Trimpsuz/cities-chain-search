export const Modal = ({ isOpen, onClose, onConfirm, text }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; text: string }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '300px',
          textAlign: 'center',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: 'black',
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#0a0a0a' }}>Confirm Action</h2>
        <p style={{ color: '#0a0a0a' }}>{text}</p>
        <div style={{ marginTop: '1rem' }}>
          <button
            style={{
              marginRight: '8px',
              padding: '8px 16px',
              backgroundColor: '#ff4d4d',
              color: '#ededed',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#0096fb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#ededed',
              fontWeight: 'bold',
            }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
