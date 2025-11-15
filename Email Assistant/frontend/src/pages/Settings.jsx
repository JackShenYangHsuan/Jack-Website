import { useState, useEffect } from 'react';
import { auth, rules as rulesApi, gmail, processing, autoProcessing } from '../services/api';
import { getUserEmail, clearAllData, getApiKey } from '../services/localStorage';
import Header from '../components/Header';
import ApiKeySection from '../components/ApiKeySection';
import RuleList from '../components/RuleList';
import RuleForm from '../components/RuleForm';
import Toast from '../components/Toast';
import TestResults from '../components/TestResults';

function Settings({ onLogout }) {
  const [userEmail, setUserEmail] = useState('');
  const [rules, setRules] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [autoProcessActive, setAutoProcessActive] = useState(false);
  const [autoProcessLoading, setAutoProcessLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user email from localStorage
      const email = getUserEmail();
      setUserEmail(email);

      // Fetch rules, labels, and auto-processing status
      const [rulesResponse, labelsResponse, statusResponse] = await Promise.all([
        rulesApi.getAll(),
        gmail.getLabels(),
        autoProcessing.getStatus()
      ]);

      const fetchedRules = rulesResponse.data.rules || [];
      setRules(fetchedRules);
      setLabels(labelsResponse.data.labels || []);

      const isActive = statusResponse.data.isActive || false;
      setAutoProcessActive(isActive);

      // Auto-start processing if user has API key and rules, but processing is not active
      const apiKey = getApiKey();
      if (!isActive && apiKey && fetchedRules.length > 0) {
        console.log('[loadData] Auto-starting email processing...');
        try {
          await autoProcessing.start({ openaiApiKey: apiKey });
          setAutoProcessActive(true);
          console.log('[loadData] Auto-processing started successfully');
        } catch (error) {
          console.error('[loadData] Failed to auto-start processing:', error);
          // Silently fail - user can manually start if needed
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account? All rules will be deleted.')) {
      return;
    }

    try {
      await auth.disconnect();
      clearAllData();
      onLogout();
      showToast('Successfully disconnected', 'success');
    } catch (error) {
      console.error('Disconnect error:', error);
      showToast('Failed to disconnect. Please try again.', 'error');
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleForm(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowRuleForm(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await rulesApi.delete(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
      showToast('Rule deleted successfully', 'success');
    } catch (error) {
      console.error('Delete rule error:', error);
      showToast(error.response?.data?.error?.message || 'Failed to delete rule', 'error');
    }
  };

  const handleToggleRule = async (ruleId, isActive) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      await rulesApi.update(ruleId, { ...rule, is_active: isActive });

      setRules(rules.map(r =>
        r.id === ruleId ? { ...r, is_active: isActive } : r
      ));

      showToast(`Rule ${isActive ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      console.error('Toggle rule error:', error);
      showToast('Failed to update rule', 'error');
    }
  };

  const handleSaveRule = async (ruleData) => {
    try {
      if (editingRule) {
        // Update existing rule
        const response = await rulesApi.update(editingRule.id, ruleData);
        setRules(rules.map(r =>
          r.id === editingRule.id ? response.data.rule : r
        ));
        showToast('Rule updated successfully', 'success');
      } else {
        // Create new rule
        const response = await rulesApi.create(ruleData);
        setRules([...rules, response.data.rule]);
        showToast('Rule created successfully', 'success');
      }

      setShowRuleForm(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Save rule error:', error);
      throw error; // Let RuleForm handle the error display
    }
  };

  const handleCancelForm = () => {
    setShowRuleForm(false);
    setEditingRule(null);
  };

  const handleLabelCreated = (newLabel) => {
    // Add the newly created label to the labels list
    setLabels(prevLabels => [...prevLabels, newLabel]);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleTestRules = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      showToast('Please add your OpenAI API key first', 'error');
      return;
    }

    if (rules.length === 0) {
      showToast('Please create at least one rule first', 'error');
      return;
    }

    setTesting(true);
    try {
      const response = await processing.testRules(10); // Test last 10 emails
      setTestResults(response.data);
    } catch (error) {
      console.error('Test rules error:', error);
      showToast(error.response?.data?.error?.message || 'Failed to test rules', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleProcessEmails = async () => {
    console.log('[handleProcessEmails] Button clicked!');

    const apiKey = getApiKey();
    console.log('[handleProcessEmails] API key check:', apiKey ? 'API key exists' : 'No API key');

    if (!apiKey) {
      console.log('[handleProcessEmails] No API key found, showing error');
      showToast('Please add your OpenAI API key first', 'error');
      return;
    }

    console.log('[handleProcessEmails] Rules count:', rules.length);
    if (rules.length === 0) {
      console.log('[handleProcessEmails] No rules found, showing error');
      showToast('Please create at least one rule first', 'error');
      return;
    }

    console.log('[handleProcessEmails] Showing confirmation dialog');
    if (!confirm('This will process your 10 most recent emails and apply labels based on your rules. Continue?')) {
      console.log('[handleProcessEmails] User cancelled confirmation');
      return;
    }

    console.log('[handleProcessEmails] User confirmed, starting email processing');
    setTesting(true);
    try {
      console.log('[handleProcessEmails] Calling processing.processInitial(10)...');
      const response = await processing.processInitial(10); // Process last 10 emails
      console.log('[handleProcessEmails] Response received:', response.data);

      const { processed, failed } = response.data;
      console.log('[handleProcessEmails] Processed:', processed, 'Failed:', failed);
      showToast(`Processed ${processed} emails successfully${failed > 0 ? `, ${failed} failed` : ''}`, 'success');
    } catch (error) {
      console.error('[handleProcessEmails] Error occurred:', error);
      console.error('[handleProcessEmails] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showToast(error.response?.data?.error?.message || 'Failed to process emails', 'error');
    } finally {
      console.log('[handleProcessEmails] Finished, setting testing to false');
      setTesting(false);
    }
  };

  const handleToggleAutoProcess = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      showToast('Please add your OpenAI API key first', 'error');
      return;
    }

    if (rules.length === 0) {
      showToast('Please create at least one rule first', 'error');
      return;
    }

    setAutoProcessLoading(true);
    try {
      if (autoProcessActive) {
        // Stop auto-processing
        await autoProcessing.stop();
        setAutoProcessActive(false);
        showToast('Automatic processing stopped', 'success');
      } else {
        // Start auto-processing - need to pass openaiApiKey in request body
        const startPayload = { openaiApiKey: apiKey };
        await autoProcessing.start(startPayload);
        setAutoProcessActive(true);
        showToast('Automatic processing started - new emails will be tagged automatically', 'success');
      }
    } catch (error) {
      console.error('Toggle auto-process error:', error);
      showToast(error.response?.data?.error?.message || 'Failed to toggle automatic processing', 'error');
    } finally {
      setAutoProcessLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userEmail={userEmail}
        onDisconnect={handleDisconnect}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Key Section */}
        <ApiKeySection />

        {/* Automatic Processing Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Automatic Email Processing</h3>
              <p className="mt-1 text-sm text-gray-600">
                Automatically process new emails as they arrive and apply labels based on your rules.
                The system checks for new emails every 2 minutes.
              </p>
              {autoProcessActive && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Active - Processing new emails automatically
                </div>
              )}
            </div>
            <div className="ml-6">
              <button
                onClick={handleToggleAutoProcess}
                disabled={autoProcessLoading || rules.length === 0}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  autoProcessActive ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoProcessActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Rules Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tagging Rules</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create rules to automatically tag your emails using natural language
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTestRules}
                disabled={testing || rules.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Test Rules
                  </>
                )}
              </button>
              <button
                onClick={handleProcessEmails}
                disabled={testing || rules.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Process Emails
                  </>
                )}
              </button>
              <button
                onClick={handleCreateRule}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Rule
              </button>
            </div>
          </div>

          {showRuleForm ? (
            <RuleForm
              rule={editingRule}
              labels={labels}
              onSave={handleSaveRule}
              onCancel={handleCancelForm}
              onLabelCreated={handleLabelCreated}
            />
          ) : (
            <RuleList
              rules={rules}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
              onToggle={handleToggleRule}
            />
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Test Results Modal */}
      {testResults && (
        <TestResults
          results={testResults}
          onClose={() => setTestResults(null)}
        />
      )}
    </div>
  );
}

export default Settings;
