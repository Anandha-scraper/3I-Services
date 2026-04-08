import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, Check, AlertTriangle, ArrowLeft } from 'lucide-react';

import Alert from '../components/Alert';
import { apiFetch } from '../utils/api';
import '../styles/pagestyles/excel.css';

export default function ExcelPage() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);
  const fileInputRef = useRef(null);
  const [alert, setAlert] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState(null);

  const cards = [
    {
      id: 'master',
      title: 'Upload Master',
      desc: 'Upload and manage Excel master data files. Import new records and update existing master data.',
      icon: Upload,
      color: '#AEB784',
      endpoint: '/api/excel/master/upload',
    },
    {
      id: 'outstanding',
      title: 'Upload Outstandings',
      desc: 'Upload outstanding ledger transactions. Validates against master ledger data, updates debit/credit values, and maintains audit logs.',
      icon: FileUp,
      color: '#AEB784',
      endpoint: '/api/excel/outstanding/upload',
    },
  ];

  const handleCardClick = (cardId) => {
    setActiveCard(cardId);
    setFileType(cardId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !fileType) return;

    const card = cards.find(c => c.id === fileType);
    setUploading(true);
    setUploadProgress(0);
    setAlert({
      type: 'uploading',
      title: 'Uploading',
      message: `Uploading ${file.name}...`,
    });

    // Animate progress 0 → 80% over ~2s while waiting
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 80) { clearInterval(progressInterval); return 80; }
        return prev + 2;
      });
    }, 50);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Enforce minimum 2.5s display time for the uploading alert
      const [response] = await Promise.all([
        apiFetch(card.endpoint, {
          method: 'POST',
          body: formData,
        }),
        new Promise(resolve => setTimeout(resolve, 2500)),
      ]);

      // Try to parse response as JSON
      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        // Handle outstanding upload errors with validation details
        if (fileType === 'outstanding' && data.invalidRecords) {
          const invalidCount = data.invalidRecords.length;
          const errorList = data.invalidRecords
            .slice(0, 5)
            .map(r => `- ${r.ledger || 'Unknown'}: ${r.error}`)
            .join('\n');
          throw new Error(
            `${data.message}\n\nFirst 5 errors:\n${errorList}${invalidCount > 5 ? `\n... and ${invalidCount - 5} more` : ''}`
          );
        }
        throw new Error(data?.message || `Upload failed with status ${response.status}`);
      }

      // Snap progress to 100% on success
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Handle outstanding upload success with validation results
      if (fileType === 'outstanding') {
        const notFoundCount = data.notFound?.length || 0;

        // Always show success on successful upload response.
        // If some ledgers were not found, we still consider the upload processed.
        setAlert({
          type: 'success',
          title: 'Upload Successful',
          message: (
            <div className="upload-success-stats">
              <span className="stat-item success-stat"><Check size={16} /> Processed: {data.processed} records</span>
              <span className="stat-item success-stat"><Check size={16} /> Updated: {data.updated} ledgers</span>
              <span className="stat-item success-stat"><Check size={16} /> Logs created: {data.logsCreated}</span>
              {notFoundCount > 0 && (
                <span className="stat-item warning-stat"><AlertTriangle size={16} /> Not found in master: {notFoundCount}</span>
              )}
            </div>
          ),
          onConfirm: () => {
            setAlert(null);
            setActiveCard(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          },
        });
      } else {
        // Master upload success
        setAlert({
          type: 'success',
          title: 'Upload Successful',
          message: `${data.inserted} records imported from ${data.fileName}`,
          onConfirm: () => {
            setAlert(null);
            setActiveCard(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          },
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      console.error('Upload error:', error);
      setAlert({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'An error occurred during upload',
        onCancel: () => {
          setAlert(null);
          setActiveCard(null);
        },
        onConfirm: () => {
          setAlert(null);
          setActiveCard(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      });
    }
  };

  return (
    <div className="excel-page">
      {/* Top bar: back button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1rem 0' }}>
        <button className="page-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="portal-cards-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const cardClassName = `portal-card portal-card-${index + 1} ${activeCard === card.id ? 'active' : ''}`;
          return (
            <div
              key={card.id}
              className={cardClassName}
              onClick={() => handleCardClick(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(card.id);
                }
              }}
            >
              <div className="portal-card-icon">
                <Icon size={40} color={card.color} />
              </div>
              <h2 className="portal-card-title">{card.title}</h2>
              <p className="portal-card-desc">{card.desc}</p>
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Upload Excel file"
      />

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onConfirm={alert.onConfirm}
          onCancel={alert.onCancel}
          progress={uploadProgress}
        />
      )}
    </div>
  );
}
