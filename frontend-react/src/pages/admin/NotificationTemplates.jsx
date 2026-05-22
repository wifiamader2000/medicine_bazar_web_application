import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, Bell, Settings, Send, History, CheckCircle, XCircle, AlertTriangle, PlayCircle } from 'lucide-react';
import api from '../../services/api';

const NotificationTemplates = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [testForm, setTestForm] = useState({
    channel: 'sms',
    recipient: '',
    templateKey: '',
    variables: '{}'
  });
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/templates');
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/notifications/logs?limit=50');
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    try {
      const res = await api.post('/notifications/templates', editingTemplate);
      setMessage(res.data.message);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save template');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setTestResult(null);
    try {
      let vars = {};
      try {
        vars = JSON.parse(testForm.variables || '{}');
      } catch (e) {
        setTestResult({ success: false, message: 'Invalid JSON for variables' });
        setActionLoading(false);
        return;
      }

      const res = await api.post('/notifications/send-test', {
        ...testForm,
        variables: vars
      });
      setTestResult({
        success: res.data.success,
        status: res.data.status,
        message: res.data.message
      });
      fetchLogs();
    } catch (err) {
      setTestResult({
        success: false,
        status: 'error',
        message: err.response?.data?.message || 'Failed to send test'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const predefinedVariables = ['{{customerName}}', '{{orderId}}', '{{amount}}', '{{paymentMethod}}', '{{status}}', '{{dueAmount}}', '{{supportPhone}}'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notification Center</h1>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500 mr-4" />
            <div>
              <h3 className="font-bold">SMS Provider</h3>
              <p className="text-sm text-gray-500">Auto-alerts via API</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending Config</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-indigo-500 mr-4" />
            <div>
              <h3 className="font-bold">Email Provider</h3>
              <p className="text-sm text-gray-500">SMTP Integration</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending Config</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div className="flex items-center">
            <Phone className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <h3 className="font-bold">WhatsApp</h3>
              <p className="text-sm text-gray-500">Manual wa.me links</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active (Link Only)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 ${activeTab === 'templates' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('templates')}
        >
          <Settings className="inline w-4 h-4 mr-2"/> Templates
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'test' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('test')}
        >
          <PlayCircle className="inline w-4 h-4 mr-2"/> Send Test
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'logs' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('logs')}
        >
          <History className="inline w-4 h-4 mr-2"/> Logs
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Template List */}
              <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold">Available Templates</h3>
                  <button 
                    onClick={() => setEditingTemplate({ key: '', title: '', channel: 'sms', subject: '', body: '', bodyBn: '', variables: [], active: true })}
                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                  >
                    + New
                  </button>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {templates.map(t => (
                    <div 
                      key={t.id} 
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${editingTemplate?.id === t.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => setEditingTemplate({...t})}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.key} • {t.channel}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${t.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && <div className="p-4 text-gray-500 text-sm">No templates found</div>}
                </div>
              </div>

              {/* Editor */}
              <div className="lg:col-span-2">
                {editingTemplate ? (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="font-bold text-lg mb-4">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h3>
                    <form onSubmit={handleSaveTemplate}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Key (Internal)</label>
                          <input type="text" className="w-full border rounded p-2" value={editingTemplate.key} onChange={e => setEditingTemplate({...editingTemplate, key: e.target.value})} required disabled={!!editingTemplate.id} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Title (Display)</label>
                          <input type="text" className="w-full border rounded p-2" value={editingTemplate.title} onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Channel</label>
                          <select className="w-full border rounded p-2" value={editingTemplate.channel} onChange={e => setEditingTemplate({...editingTemplate, channel: e.target.value})}>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="system">System App Alert</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <select className="w-full border rounded p-2" value={editingTemplate.active ? 'true' : 'false'} onChange={e => setEditingTemplate({...editingTemplate, active: e.target.value === 'true'})}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                      </div>
                      
                      {editingTemplate.channel === 'email' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-1">Email Subject</label>
                          <input type="text" className="w-full border rounded p-2" value={editingTemplate.subject || ''} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 flex justify-between">
                          <span>English Body</span>
                          <span className="text-xs text-gray-400">Can use variables</span>
                        </label>
                        <textarea className="w-full border rounded p-2 h-24" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}></textarea>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Bangla Body (Optional)</label>
                        <textarea className="w-full border rounded p-2 h-24" value={editingTemplate.bodyBn} onChange={e => setEditingTemplate({...editingTemplate, bodyBn: e.target.value})}></textarea>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                        <h4 className="text-sm font-bold mb-2">Available Variables</h4>
                        <div className="flex flex-wrap gap-2">
                          {predefinedVariables.map(v => (
                            <span key={v} className="bg-white border text-xs px-2 py-1 rounded shadow-sm text-indigo-700">{v}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingTemplate(null)} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Template</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg border border-dashed flex items-center justify-center h-64 text-gray-400">
                    Select a template to edit or create a new one
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEND TEST TAB */}
          {activeTab === 'test' && (
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-bold text-lg mb-4">Send Test Notification</h3>
              
              {testResult && (
                <div className={`p-4 mb-4 rounded flex items-start ${testResult.status === 'provider_not_configured' ? 'bg-yellow-50 text-yellow-800' : testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {testResult.success ? <CheckCircle className="w-5 h-5 mr-2 shrink-0"/> : (testResult.status === 'provider_not_configured' ? <AlertTriangle className="w-5 h-5 mr-2 shrink-0"/> : <XCircle className="w-5 h-5 mr-2 shrink-0"/>)}
                  <div>
                    <p className="font-bold">Status: {testResult.status}</p>
                    <p className="text-sm">{testResult.message}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendTest}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Channel</label>
                  <select className="w-full border rounded p-2" value={testForm.channel} onChange={e => setTestForm({...testForm, channel: e.target.value})}>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Recipient (Phone or Email)</label>
                  <input type="text" className="w-full border rounded p-2" placeholder="+8801..." value={testForm.recipient} onChange={e => setTestForm({...testForm, recipient: e.target.value})} required />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Template</label>
                  <select className="w-full border rounded p-2" value={testForm.templateKey} onChange={e => setTestForm({...testForm, templateKey: e.target.value})} required>
                    <option value="">-- Select Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.key}>{t.title} ({t.key})</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Variables JSON</label>
                  <textarea 
                    className="w-full border rounded p-2 font-mono text-sm" 
                    rows="4" 
                    value={testForm.variables} 
                    onChange={e => setTestForm({...testForm, variables: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" disabled={actionLoading} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  <Send className="w-4 h-4 mr-2" /> Send Test Alert
                </button>
              </form>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold">Recent Logs</h3>
                <button onClick={fetchLogs} className="text-sm px-3 py-1 border rounded bg-white hover:bg-gray-100">Refresh</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border-b">Date</th>
                      <th className="p-3 border-b">Channel</th>
                      <th className="p-3 border-b">Recipient</th>
                      <th className="p-3 border-b">Template</th>
                      <th className="p-3 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-3 uppercase text-xs font-bold text-gray-500">{log.channel}</td>
                        <td className="p-3">{log.recipient}</td>
                        <td className="p-3 font-mono text-xs">{log.templateKey}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800' :
                            log.status === 'provider_not_configured' ? 'bg-yellow-100 text-yellow-800' :
                            log.status === 'manual_action_required' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-gray-500">No logs found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationTemplates;
