import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Check, X, File, Trash2, Download } from 'lucide-react';

const DocumentsView = ({ currentUser, documentType = 'project' }) => {
  const [documents, setDocuments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedAllocationId, setSelectedAllocationId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchContextData();
  }, [currentUser]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/documents`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const fetchContextData = async () => {
    try {
      if (currentUser.role === 'STUDENT') {
        const res = await axios.get(`http://localhost:5000/students/${currentUser.id}/projects`);
        setAllocations(res.data);
      } else if (currentUser.role === 'MENTOR') {
        const res = await axios.get(`http://localhost:5000/faculty/${currentUser.id}/mentored`);
        setAllocations(res.data);
      } else {
         const campusQuery = (currentUser.role === 'SPONSOR' && currentUser.campusId) ? `?campusId=${currentUser.campusId}` : '';
         const res = await axios.get(`http://localhost:5000/projects${campusQuery}`);
         setProjects(res.data);
         const allocRes = await axios.get(`http://localhost:5000/allocations${campusQuery}`);
         if(allocRes.data) setAllocations(allocRes.data);
      }
    } catch(err) {
        console.error('Failed to fetch context data', err);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedById', currentUser.id);
    
    if (documentType === 'project' && selectedProjectId) {
      formData.append('projectId', selectedProjectId);
    } else if (documentType === 'allocation' && selectedAllocationId) {
      formData.append('allocationId', selectedAllocationId);
    } else {
        alert("Please select a target for the document.");
        return;
    }

    setIsUploading(true);
    try {
      await axios.post('http://localhost:5000/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSelectedFile(null);
      setSelectedProjectId('');
      setSelectedAllocationId('');
      fetchDocuments();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReview = async (id, status) => {
      const feedback = prompt("Enter feedback (optional):", "");
      if(feedback === null) return;
      try {
          await axios.put(`http://localhost:5000/api/documents/${id}/review`, { status, feedback });
          fetchDocuments();
      } catch(err) {
          console.error("Failed to review", err);
      }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this document?")) return;
      try {
          await axios.delete(`http://localhost:5000/api/documents/${id}`);
          fetchDocuments();
      } catch(err) {
          console.error("Failed to delete", err);
      }
  };

  return (
    <div style={{ padding: '24px', color: 'var(--text-main)', width: '100%', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '800' }}>Documents Repository</h1>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={20} /> Upload New Document
        </h2>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Link To</label>
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '14px', fontWeight: '600' }}>
                    {documentType === 'project' ? 'Project (Global Document)' : 'Allocation (Student Submission)'}
                </div>
              </div>

              <div style={{ flex: 2 }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Select Target</label>
                 {documentType === 'project' ? (
                     <select 
                        value={selectedProjectId} 
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="form-select"
                     >
                         <option value="">-- Select Project --</option>
                         {projects.map(p => (
                             <option key={p.id} value={p.id}>{p.title}</option>
                         ))}
                     </select>
                 ) : (
                     <select 
                        value={selectedAllocationId} 
                        onChange={(e) => setSelectedAllocationId(e.target.value)}
                        className="form-select"
                     >
                         <option value="">-- Select Allocation --</option>
                         {allocations.map(a => (
                             <option key={a.id} value={a.id}>{a.project?.title || a.id} (Assigned to {a.assignedTo})</option>
                         ))}
                     </select>
                 )}
              </div>
          </div>

          <div>
             <input type="file" onChange={handleFileChange} style={{ display: 'block', marginBottom: '16px', color: 'var(--text-main)' }} />
          </div>

          <button 
            type="submit" 
            disabled={!selectedFile || isUploading}
            className="btn-primary"
            style={{ 
                cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed', alignSelf: 'flex-start',
                opacity: (!selectedFile || isUploading) ? 0.5 : 1
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> All Documents
          </h2>
          
          {documents.filter(doc => documentType === 'project' ? doc.projectId : doc.allocationId).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No {documentType === 'project' ? 'Project Documents' : 'Student Submissions'} found.</p>
          ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {documents.filter(doc => documentType === 'project' ? doc.projectId : doc.allocationId).map(doc => (
                      <div key={doc.id} style={{ background: 'var(--bg-sidebar)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-glass)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                 <File size={20} color="var(--primary)" />
                                 <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.filename}>{doc.filename}</span>
                             </div>
                             <a href={`http://localhost:5000${doc.filepath}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                                 <Download size={18} />
                             </a>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                              <p>Uploaded by: {doc.uploadedBy?.name}</p>
                              {doc.project && <p>Project: {doc.project.title}</p>}
                              {doc.allocationId && <p>Allocation ID: {doc.allocationId.substring(0,8)}...</p>}
                              <p>Date: {new Date(doc.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
                              <span style={{ 
                                  fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px',
                                  background: (doc.status === 'Approved' || doc.status === 'Information') ? 'var(--status-done-bg)' : doc.status === 'Rejected' ? 'var(--priority-high-bg)' : 'var(--status-backlog-bg)',
                                  color: (doc.status === 'Approved' || doc.status === 'Information') ? 'var(--status-done-text)' : doc.status === 'Rejected' ? 'var(--priority-high-text)' : 'var(--status-backlog-text)',
                                  border: `1px solid ${(doc.status === 'Approved' || doc.status === 'Information') ? 'var(--status-done-border)' : doc.status === 'Rejected' ? 'var(--priority-high-border)' : 'var(--status-backlog-border)'}`
                              }}>
                                  {doc.status}
                              </span>
                              
                              <div style={{ display: 'flex', gap: '8px' }}>
                                  {((currentUser.role === 'MENTOR' && doc.status === 'Pending Faculty Review') || 
                                    (currentUser.role === 'SPONSOR' && doc.status === 'Pending Coordinator Review')) && doc.allocationId && (
                                      <>
                                          <button onClick={() => handleReview(doc.id, 'Approved')} style={{ background: 'var(--status-done-bg)', color: 'var(--status-done-text)', border: '1px solid var(--status-done-border)', borderRadius: '4px', padding: '4px', cursor: 'pointer' }} title="Approve">
                                              <Check size={16} />
                                          </button>
                                          <button onClick={() => handleReview(doc.id, 'Rejected')} style={{ background: 'var(--priority-high-bg)', color: 'var(--priority-high-text)', border: '1px solid var(--priority-high-border)', borderRadius: '4px', padding: '4px', cursor: 'pointer' }} title="Reject">
                                              <X size={16} />
                                          </button>
                                      </>
                                  )}
                                  {(currentUser.id === doc.uploadedById || currentUser.role === 'MODERATOR') && (
                                      <button onClick={() => handleDelete(doc.id)} style={{ background: 'transparent', color: 'var(--priority-high-text)', border: 'none', padding: '4px', cursor: 'pointer' }} title="Delete">
                                          <Trash2 size={16} />
                                      </button>
                                  )}
                              </div>
                          </div>
                          {doc.feedback && (
                              <div style={{ marginTop: '12px', fontSize: '12px', background: 'var(--bg-main)', padding: '8px', borderRadius: '4px', color: 'var(--text-dim)', border: '1px solid var(--border-glass)' }}>
                                  <strong style={{ color: 'var(--text-main)' }}>Feedback:</strong> {doc.feedback}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default DocumentsView;
