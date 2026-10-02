import { useState } from 'react';
import { Download, Smartphone, Monitor, Apple, X, Share, Plus, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function DownloadAppSection() {
  const { canInstall, isInstalled, platform, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleDownload = async () => {
    if (platform === 'ios') {
      setShowIOSGuide(true);
      return;
    }
    if (canInstall) {
      setInstalling(true);
      const accepted = await promptInstall();
      setInstalling(false);
      if (accepted) setJustInstalled(true);
    }
  };

  if (isInstalled) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-blue-50 to-slate-100 rounded-3xl p-8 md:p-12 text-center border border-blue-100">
          <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">App Installed</h2>
          <p className="text-slate-600 mt-2 max-w-md mx-auto">
            You're using the lidar.rentals app. Find it on your home screen or dock for quick access.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-4">
              <Smartphone className="w-4 h-4" />
              Get the App
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Download the lidar.rentals App
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Install lidar.rentals on your phone or desktop for instant access to equipment rentals,
              booking calendars, and scanning services — even offline. No app store needed.
            </p>

            {/* Download button */}
            <div className="mt-6">
              {justInstalled ? (
                <div className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-xl font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  App Installed!
                </div>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={installing}
                  className="inline-flex items-center gap-3 px-7 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-105 disabled:opacity-60"
                >
                  <Download className="w-5 h-5" />
                  {installing ? 'Installing...' : 'Download Now'}
                </button>
              )}
            </div>

            {/* Platform indicators */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Apple className="w-4 h-4" /> iOS
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Android
              </span>
              <span className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4" /> Desktop
              </span>
            </div>
          </div>

          {/* Right: Phone mockup preview */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-64 h-96 bg-slate-900 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-2xl z-10" />

                {/* Screen content */}
                <div className="h-full flex flex-col">
                  {/* Status bar */}
                  <div className="h-8 bg-slate-800 flex items-center justify-between px-6 pt-2">
                    <span className="text-[10px] text-slate-400 font-medium">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-2 rounded-sm bg-slate-600" />
                      <div className="w-3 h-2 rounded-sm bg-slate-600" />
                    </div>
                  </div>

                  {/* App header */}
                  <div className="px-4 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">lidar.rentals</span>
                    </div>
                  </div>

                  {/* App body */}
                  <div className="flex-1 bg-slate-50 p-3 space-y-2.5 overflow-hidden">
                    <div className="h-24 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col justify-center px-3">
                      <span className="text-[10px] text-blue-100 font-medium">Featured</span>
                      <span className="text-xs font-bold text-white">Mini Excavator</span>
                      <span className="text-[10px] text-blue-200">From $350/day</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-20 rounded-lg bg-white border border-slate-100 p-2">
                        <div className="w-full h-8 rounded bg-slate-100 mb-1" />
                        <div className="h-1.5 w-3/4 rounded bg-slate-200" />
                        <div className="h-1.5 w-1/2 rounded bg-slate-100 mt-1" />
                      </div>
                      <div className="h-20 rounded-lg bg-white border border-slate-100 p-2">
                        <div className="w-full h-8 rounded bg-slate-100 mb-1" />
                        <div className="h-1.5 w-3/4 rounded bg-slate-200" />
                        <div className="h-1.5 w-1/2 rounded bg-slate-100 mt-1" />
                      </div>
                    </div>
                    <div className="h-16 rounded-lg bg-slate-900 p-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="h-2 w-20 rounded bg-slate-700 mb-1" />
                        <div className="h-1.5 w-14 rounded bg-slate-800" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="h-12 bg-white border-t border-slate-100 flex items-center justify-around px-4">
                    <div className="w-5 h-5 rounded bg-blue-600" />
                    <div className="w-5 h-5 rounded bg-slate-200" />
                    <div className="w-5 h-5 rounded bg-slate-200" />
                    <div className="w-5 h-5 rounded bg-slate-200" />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -right-4 top-12 px-3 py-2 bg-white rounded-xl shadow-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-900">Installable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS install guide modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Install on iOS</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap the Share button</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Look for the Share icon at the bottom of your browser.
                  </p>
                  <Share className="w-5 h-5 text-blue-600 mt-2" />
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Select "Add to Home Screen"</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scroll down and tap "Add to Home Screen" in the share menu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap "Add"</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirm by tapping Add. The lidar.rentals app will appear on your home screen.
                  </p>
                  <Plus className="w-5 h-5 text-blue-600 mt-2" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
