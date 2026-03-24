import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCrosswalks, fetchAlerts, getImageUrl } from '../services/api';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Image as ImageIcon, Activity, Filter, X } from 'lucide-react';
import ImageModal from '../components/ImageModal';
import CameraStatus from '../components/CameraStatus';
import { SkeletonHeader, SkeletonAlert } from '../components/SkeletonLoader';

const CrosswalkDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crosswalk, setCrosswalk] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    enabled: false
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [crosswalksData, alertsData] = await Promise.all([
          fetchCrosswalks(),
          fetchAlerts()
        ]);

        const currentCrosswalk = crosswalksData.find(cw => cw._id === id);
        
        if (!currentCrosswalk) {
          setError('מעבר חצייה לא נמצא');
          setLoading(false);
          return;
        }

        setCrosswalk(currentCrosswalk);

        const crosswalkAlerts = alertsData.filter(alert => {
          const alertCrosswalkId = typeof alert.crosswalkId === 'object' 
            ? alert.crosswalkId?._id 
            : alert.crosswalkId;
          
          return alertCrosswalkId?.toString() === id?.toString();
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setAlerts(crosswalkAlerts);
        setError(null);
      } catch (err) {
        setError('שגיאה בטעינת הנתונים');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const filteredAlerts = useMemo(() => {
    if (!dateFilter.enabled || (!dateFilter.startDate && !dateFilter.endDate)) {
      return alerts;
    }

    return alerts.filter(alert => {
      const alertDate = new Date(alert.timestamp);
      
      if (dateFilter.startDate && dateFilter.endDate) {
        const start = new Date(dateFilter.startDate);
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        return alertDate >= start && alertDate <= end;
      } else if (dateFilter.startDate) {
        const start = new Date(dateFilter.startDate);
        return alertDate >= start;
      } else if (dateFilter.endDate) {
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        return alertDate <= end;
      }
      
      return true;
    });
  }, [dateFilter, alerts]);

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'פעיל';
      case 'maintenance': return 'תחזוקה';
      case 'inactive': return 'לא פעיל';
      default: return status;
    }
  };

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '', enabled: false });
  };

  const applyDateFilter = () => {
    setDateFilter(prev => ({ ...prev, enabled: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <SkeletonHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-8 w-24 bg-blue-100 rounded-full animate-pulse"></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-10 bg-gray-100 rounded-xl"></div>
                <div className="h-10 bg-gray-100 rounded-xl"></div>
                <div className="h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl"></div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonAlert key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !crosswalk) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertTriangle className="mx-auto text-red-600 mb-3" size={48} />
          <p className="text-red-800 font-semibold mb-4">{error || 'מעבר חצייה לא נמצא'}</p>
          <button 
            onClick={() => navigate('/crosswalks')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            חזור לרשימה
          </button>
        </div>
      </div>
    );
  }

  const hazardCount = filteredAlerts.filter(a => a.isHazard).length;
  const ledActivatedCount = filteredAlerts.filter(a => a.ledActivated).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 text-white">
          <button
            onClick={() => navigate('/crosswalks')}
            className="flex items-center gap-2 hover:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg mb-4 sm:mb-6 transition text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>חזור לרשימה</span>
          </button>

          <div className="flex flex-col lg:flex-row items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 w-full min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 truncate">{crosswalk.name}</h1>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-blue-100">
                <div className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg w-full sm:w-auto">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="font-mono text-xs sm:text-sm truncate">
                    {crosswalk.location?.lat?.toFixed(6)}, {crosswalk.location?.lng?.toFixed(6)}
                  </span>
                </div>
                {crosswalk.ledSystemUrl && (
                  <div className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg w-full sm:w-auto">
                    <Activity className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{crosswalk.ledSystemUrl}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-1 lg:flex-initial">
                <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border-2 border-white/30 bg-white/10 text-white flex-1 lg:flex-initial justify-center`}>
                  {getStatusText(crosswalk.status)}
                </span>
                <div className="bg-white/10 p-1.5 sm:p-2 rounded-full border-2 border-white/30">
                  <CameraStatus status={crosswalk.status} size="md" showLabel={false} />
                </div>
              </div>
              <span className="text-xs text-blue-100 bg-white/10 px-2 sm:px-3 py-1 rounded-full">מזהה: {crosswalk._id.slice(-8)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="text-2xl sm:text-3xl font-bold mb-1">{filteredAlerts.length}</div>
              <div className="text-blue-100 text-xs sm:text-sm">סך הכל התרעות</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="text-2xl sm:text-3xl font-bold mb-1 text-red-300">{hazardCount}</div>
              <div className="text-blue-100 text-xs sm:text-sm">אירועי סכנה</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 sm:col-span-2 md:col-span-1">
              <div className="text-2xl sm:text-3xl font-bold mb-1 text-green-300">{ledActivatedCount}</div>
              <div className="text-blue-100 text-xs sm:text-sm">הפעלות LED</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">היסטוריית התרעות</h2>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold">{filteredAlerts.length} התרעות</span>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <span className="font-bold text-gray-900 text-base sm:text-lg">סינון לפי תאריך</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">מתאריך</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base shadow-sm hover:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">עד תאריך</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base shadow-sm hover:border-blue-400"
                />
              </div>

              <div className="flex items-end gap-2 sm:col-span-2 md:col-span-1">
                <button
                  onClick={applyDateFilter}
                  disabled={!dateFilter.startDate && !dateFilter.endDate}
                  className="flex-1 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  החל סינון
                </button>
                {dateFilter.enabled && (
                  <button
                    onClick={clearDateFilter}
                    className="px-3 sm:px-4 py-2.5 bg-white border border-red-300 text-red-700 rounded-xl hover:bg-red-50 hover:border-red-400 transition shadow-sm"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {dateFilter.enabled && (dateFilter.startDate || dateFilter.endDate) && (
              <div className="mt-3 text-sm text-gray-600">
                מציג התרעות {dateFilter.startDate && `מתאריך ${new Date(dateFilter.startDate).toLocaleDateString('he-IL')}`}
                {dateFilter.startDate && dateFilter.endDate && ' '}
                {dateFilter.endDate && `עד ${new Date(dateFilter.endDate).toLocaleDateString('he-IL')}`}
              </div>
            )}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <AlertTriangle className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">אין התרעות</h3>
            <p className="text-gray-600 mb-4">
              {dateFilter.enabled ? 'לא נמצאו התרעות בטווח התאריכים שנבחר' : 'עדיין לא נרשמו התרעות במעבר חצייה זה'}
            </p>
            {dateFilter.enabled && (
              <button
                onClick={clearDateFilter}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                נקה סינון
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-r-[6px] overflow-hidden ${
                  alert.isHazard ? 'border-red-500' : 'border-yellow-500'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {alert.isHazard ? (
                          <span className="text-2xl">🚨</span>
                        ) : (
                          <span className="text-2xl">⚠️</span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900">{alert.description}</h3>
                      </div>
                      
                      {alert.reasons && alert.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {alert.reasons.map((reason, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(alert.timestamp).toLocaleString('he-IL')}</span>
                        </div>
                        {(alert.detectionDistance !== null && alert.detectionDistance !== undefined) && (
                          <div>
                            <span className="font-semibold">מרחק:</span> {alert.detectionDistance.toFixed(1)} מ'
                          </div>
                        )}
                        {alert.detectedObjectsCount && (
                          <div>
                            <span className="font-semibold">אובייקטים:</span> {alert.detectedObjectsCount}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {alert.ledActivated && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          💡 LED הופעל
                        </span>
                      )}
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        alert.isHazard 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.isHazard ? 'סכנה גבוהה' : 'אזהרה'}
                      </span>
                    </div>
                  </div>

                  {alert.imageUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => setSelectedImage(alert.imageUrl)}
                          className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition group"
                        >
                          <img
                            src={getImageUrl(alert.imageUrl)}
                            alt="Alert"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden absolute inset-0 bg-gray-200 items-center justify-center flex-col gap-2">
                            <ImageIcon className="text-gray-400" size={32} />
                            <span className="text-xs text-gray-500 text-center px-2">PlaceHolder</span>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                              לחץ להגדלה
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 text-xs text-gray-500">
                          <p className="mb-1">
                            <span className="font-semibold">מקור תמונה:</span>
                          </p>
                          <p className="font-mono break-all">{alert.imageUrl}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!alert.imageUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                          <ImageIcon size={32} />
                          <span className="text-xs mt-2">PlaceHolder</span>
                        </div>
                        <span className="text-sm">אין תמונה זמינה</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrosswalkDetails;