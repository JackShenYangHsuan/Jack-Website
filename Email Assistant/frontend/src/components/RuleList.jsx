import RuleCard from './RuleCard';

function RuleList({ rules, onEdit, onDelete, onToggle }) {
  if (rules.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg px-6 py-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No rules yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating your first tagging rule.
        </p>
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-2">Example rules:</p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• "Emails from my manager about quarterly reports"</li>
            <li>• "Newsletters about AI and machine learning"</li>
            <li>• "Meeting invitations from anyone in the sales team"</li>
          </ul>
        </div>
      </div>
    );
  }

  // Separate rules by type
  const receivedRules = rules.filter(r => r.rule_type === 'received').sort((a, b) => b.priority - a.priority);
  const sentRules = rules.filter(r => r.rule_type === 'sent').sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-8">
      {/* Received Email Rules Section */}
      <div>
        <div className="mb-4 pb-2 border-b-2 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900">Received Email Rules</h3>
          <p className="mt-1 text-sm text-gray-600">
            Rules for emails you receive from others
          </p>
        </div>
        {receivedRules.length === 0 ? (
          <div className="bg-gray-50 rounded-lg px-6 py-8 text-center border border-gray-200">
            <p className="text-sm text-gray-500">
              No received email rules yet. Create one to automatically tag incoming emails.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sent Email Rules Section */}
      <div>
        <div className="mb-4 pb-2 border-b-2 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900">Sent Email Rules</h3>
          <p className="mt-1 text-sm text-gray-600">
            Rules for emails you send to others
          </p>
        </div>
        {sentRules.length === 0 ? (
          <div className="bg-gray-50 rounded-lg px-6 py-8 text-center border border-gray-200">
            <p className="text-sm text-gray-500">
              No sent email rules yet. Create one to automatically tag your outgoing emails.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sentRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RuleList;
