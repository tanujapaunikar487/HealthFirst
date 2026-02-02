import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';

interface Props {
  user: any;
  videoSettings: {
    provider: 'google_meet' | 'zoom';
    google_meet: { enabled: boolean };
    zoom: { enabled: boolean };
  };
}

export default function SettingsIndex({ user, videoSettings }: Props) {
  const [selectedProvider, setSelectedProvider] = useState(videoSettings.provider);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    router.put('/settings/video', { provider: selectedProvider }, {
      onFinish: () => setSaving(false),
    });
  };

  return (
    <AppLayout user={user}>
      <Head title="Settings" />

      <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Video Conferencing</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Preferred Provider
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('google_meet')}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedProvider === 'google_meet'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Google Meet</div>
                  <div className="text-sm text-muted-foreground">Default provider</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('zoom')}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedProvider === 'zoom'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Zoom</div>
                  <div className="text-sm text-muted-foreground">Alternative provider</div>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || selectedProvider === videoSettings.provider}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
