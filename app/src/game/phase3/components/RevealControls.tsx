import Button from '../../../shared/components/Button';

interface Props {
  onNext: () => Promise<void>;
  loading?: boolean;
}

export default function RevealControls({ onNext, loading = false }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button onClick={() => void onNext()} loading={loading}>
        Siguiente reveal
      </Button>
    </div>
  );
}
