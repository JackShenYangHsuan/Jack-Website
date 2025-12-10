import { useState } from 'react';

function TestResults({ results, onClose }) {
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  const toggleEmail = (emailId) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };

  if (!results || !results.results) {
    return null;
  }

  const stats = {
    totalEmails: results.totalEmails || 0,
    totalRules: results.totalRules || 0,
    matched: results.results.filter(r => r.wouldApplyLabel).length,
    unmatched: results.results.filter(r => !r.wouldApplyLabel).length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rule Test Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                Testing {stats.totalRules} rule{stats.totalRules !== 1 ? 's' : ''} against {stats.totalEmails} recent email{stats.totalEmails !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
              <div className="text-sm text-gray-600">Would be tagged</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-gray-400">{stats.unmatched}</div>
              <div className="text-sm text-gray-600">No match found</div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {results.results.map((result) => {
              const isExpanded = expandedEmails.has(result.email.id);
              const hasMatch = result.wouldApplyLabel;

              return (
                <div
                  key={result.email.id}
                  className={`border rounded-lg overflow-hidden ${
                    hasMatch ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  {/* Email Summary */}
                  <button
                    onClick={() => toggleEmail(result.email.id)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {hasMatch ? (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{result.email.subject || '(No subject)'}</div>
                      <div className="text-sm text-gray-600">From: {result.email.from}</div>
                      <div className="text-xs text-gray-500 mt-1">{result.email.snippet}</div>
                      {hasMatch && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Would apply: {result.wouldApplyLabel}
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="mt-3 space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm">Rule Evaluation Details:</h4>
                        {result.ruleMatches.map((match, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              match.matches
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {match.ruleDescription}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Label: <span className="font-medium">{match.labelName}</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {match.matches ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-600 text-white">
                                    MATCH {Math.round(match.confidence * 100)}%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-400 text-white">
                                    NO MATCH
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700 italic">
                              "{match.reasoning}"
                            </div>
                            {match.error && (
                              <div className="mt-2 text-sm text-red-600">
                                Error: {match.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestResults;
