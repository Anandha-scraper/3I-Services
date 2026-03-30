import { useState, useRef } from 'react';
import { Upload, FileUp } from 'lucide-react';
import Alert from '../components/Alert';
import { apiUrl } from '../utils/api';
import '../styles/pagestyles/excel.css';

export default function ExcelPage() {
  const [activeCard, setActiveCard] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
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
    setAlert({
      type: 'uploading',
      title: 'Uploading',
      message: `Uploading ${file.name}...`,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl(card.endpoint), {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

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

      // Handle outstanding upload success with validation results
      if (fileType === 'outstanding') {
        const foundCount = data.found?.length || 0;
        const notFoundCount = data.notFound?.length || 0;

        // Always show success on successful upload response.
        // If some ledgers were not found, we still consider the upload processed.
        setAlert({
          type: 'success',
          title: 'Upload Successful',
          message:
            `✓ Processed: ${data.processed} records\n` +
            `✓ Updated: ${data.updated} ledgers\n` +
            `✓ Logs created: ${data.logsCreated}` +
            (notFoundCount > 0 ? `\n⚠ Not found in master: ${notFoundCount}` : ''),
          onConfirm: () => {
            setAlert(null);
            setUploading(false);
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
            setUploading(false);
            setActiveCard(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          },
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setAlert({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'An error occurred during upload',
        onCancel: () => {
          setAlert(null);
          setUploading(false);
          setActiveCard(null);
        },
        onConfirm: () => {
          setAlert(null);
          setUploading(false);
          setActiveCard(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      });
    }
  };

  return (
    <div className="excel-page">
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
        />
      )}
    </div>
  );
}
