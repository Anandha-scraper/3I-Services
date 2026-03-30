import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/pagestyles/view-log.css';

export default function ViewLogPage() {
  const navigate = useNavigate();

  return (
        <div className="view-log-empty">
          <p>No activity logs available</p>
        </div>
  );
}
