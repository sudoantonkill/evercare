import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function CompleteProfile({ user }) {
  const nav = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [step, setStep] = useState('personal'); // personal, photo, location, hobbies, aadhaar, role
  const [photoData, setPhotoData] = useState(null);
  const [location, setLocation] = useState(null);
  const [hobbies, setHobbies] = useState([]);
  const [newHobby, setNewHobby] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarPhotoFile, setAadhaarPhotoFile] = useState(null);
  const [aadhaarPhotoPreview, setAadhaarPhotoPreview] = useState(null);
  const [userRole, setUserRole] = useState('elderly');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['personal', 'photo', 'location', 'hobbies', 'aadhaar', 'role'];
  const stepTitles = {
    personal: 'Personal Info',
    photo: 'Profile Photo',
    location: 'Location',
    hobbies: 'Hobbies',
    aadhaar: 'Aadhaar',
    role: 'Role Selection'
  };
  const currentStepIndex = steps.indexOf(step);

  const addHobby = () => {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      setHobbies(prev => [...prev, newHobby.trim()]);
      setNewHobby('');
    }
  };

  const removeHobby = (hobby) => {
    setHobbies(prev => prev.filter(h => h !== hobby));
  };

  useEffect(() => {
    if (!user) nav('/', { replace: true });
  }, [user, nav]);

  // Camera setup
  useEffect(() => {
    if (step !== 'photo') {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
      return;
    }

    if (streamRef.current) return;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = resolve;
          });
          // Start playing
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera setup error:', err);
        setError('Camera access denied. Please enable camera access to continue.');
      }
    };

    setupCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Flip horizontally if using front camera
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const photo = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoData(photo);
    
    // Stop the camera immediately after capturing
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const retakePhoto = async () => {
    setPhotoData(null);
    // Restart camera
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera setup error:', err);
        setError('Camera access denied. Please enable camera access to continue.');
      }
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          
          // Get location name using reverse geocoding with error handling
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch location details');
          }
          
          const data = await response.json();
          
          if (!data || !data.display_name) {
            throw new Error('Invalid location data received');
          }
          
          setLocation({
            latitude,
            longitude,
            accuracy,
            display_name: data.display_name
          });
          setError('');
        } catch (err) {
          console.error('Location error:', err);
          setError('Failed to get location details. Please try again.');
          setLocation(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Failed to get location. ';
        
        switch(err.code) {
          case 1:
            errorMessage += 'Please enable location access in your browser settings.';
            break;
          case 2:
            errorMessage += 'Position unavailable. Please try again.';
            break;
          case 3:
            errorMessage += 'Request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please try again.';
        }
        
        setError(errorMessage);
        setLocation(null);
        setLoading(false);
      },
      options
    );
  };

  const toggleHobby = (hobby) => {
    setHobbies(prev =>
      prev.includes(hobby)
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };

  const validateAadhaar = (aadhaar) => {
    return /^[0-9]{12}$/.test(aadhaar);
  };

  const handleAadhaarFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setAadhaarPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAadhaarPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const removeAadhaarPhoto = () => {
    setAadhaarPhotoFile(null);
    setAadhaarPhotoPreview(null);
  };

  const saveProfile = async () => {
    if (!fullName || !age || !photoData || !location || hobbies.length === 0 || !aadhaarNumber || !aadhaarPhotoFile || !userRole) {
      setError('Please complete all sections before proceeding');
      return;
    }

    if (!validateAadhaar(aadhaarNumber)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (parseInt(age) < 1 || parseInt(age) > 120) {
      setError('Please enter a valid age between 1 and 120');
      return;
    }

    setLoading(true);
    try {
      // Convert base64 to blob
      const base64Data = photoData.split(',')[1];
      const photoFile = await fetch(
        `data:image/jpeg;base64,${base64Data}`
      ).then(res => res.blob());
      
      const photoPath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(photoPath, photoFile, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Upload Aadhaar photo
      const aadhaarPhotoPath = `${user.id}/${Date.now()}_aadhaar.${aadhaarPhotoFile.name.split('.').pop()}`;
      const { error: aadhaarUploadError } = await supabase.storage
        .from('aadhaar-documents')
        .upload(aadhaarPhotoPath, aadhaarPhotoFile, {
          contentType: aadhaarPhotoFile.type,
          cacheControl: '3600'
        });

      if (aadhaarUploadError) throw aadhaarUploadError;

      // Update user metadata with role
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { user_role: userRole }
      });

      if (metadataError) throw metadataError;

      // Get existing profile data first to preserve phone number
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .single();

      // Update profile using upsert to handle conflicts, preserving existing phone data
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          profile_photo: photoPath,
          location,
          current_location: `${location.latitude},${location.longitude}`,
          hobbies,
          aadhaar_number: aadhaarNumber,
          aadhaar_card_photo: aadhaarPhotoPath,
          user_role: userRole,
          full_name: fullName,
          age: parseInt(age),
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
          email: user.email,
          // Preserve existing phone data, don't overwrite with null
          phone: existingProfile?.phone || user.user_metadata?.phone || null,
          phone_verified: existingProfile?.phone_verified || false
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });


      if (updateError) throw updateError;

      // Navigate to role-specific dashboard
      const dashboardPath = `/${userRole}-dashboard`;
      nav(dashboardPath, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'personal':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full p-4 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500 backdrop-blur-sm text-lg transition-all hover:bg-gray-800/70"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                  className="w-full p-4 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500 backdrop-blur-sm text-lg transition-all hover:bg-gray-800/70"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep('photo')}
                className="flex-1 btn-primary rounded-xl py-3 font-semibold"
                disabled={loading || !fullName.trim() || !age || parseInt(age) < 1 || parseInt(age) > 120}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 'photo':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">Take Your Profile Photo</h2>
            {!photoData ? (
              <div className="relative">
                <div className="camera-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-2xl transform scale-x-[-1]"
                  />
                  <div className="camera-overlay"></div>
                </div>
                <button
                  onClick={capturePhoto}
                  className="mt-6 w-full btn-primary rounded-xl py-4 font-semibold text-lg backdrop-blur-sm bg-blue-500/30 hover:bg-blue-500/40 transition-all transform hover:scale-[1.02] shadow-lg"
                  disabled={loading}
                >
                  Capture Photo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={photoData}
                  alt="Captured"
                  className="w-full rounded-2xl"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('personal')}
                    className="flex-1 btn-secondary rounded-xl py-4 font-semibold text-lg backdrop-blur-sm bg-gray-500/30 hover:bg-gray-500/40 transition-all transform hover:scale-[1.02] shadow-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={retakePhoto}
                    className="flex-1 btn-secondary rounded-xl py-4 font-semibold text-lg backdrop-blur-sm bg-gray-500/30 hover:bg-gray-500/40 transition-all transform hover:scale-[1.02] shadow-lg"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => {
                      if (streamRef.current) {
                        const tracks = streamRef.current.getTracks();
                        tracks.forEach(track => track.stop());
                        streamRef.current = null;
                        if (videoRef.current) {
                          videoRef.current.srcObject = null;
                        }
                      }
                      setStep('location');
                    }}
                    className="flex-1 btn-primary rounded-xl py-4 font-semibold text-lg backdrop-blur-sm bg-blue-500/30 hover:bg-blue-500/40 transition-all transform hover:scale-[1.02] shadow-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">Add Your Location</h2>
            {!location ? (
              <button
                onClick={getLocation}
                className="w-full btn-primary rounded-xl py-4 font-semibold text-lg backdrop-blur-sm bg-blue-500/30 hover:bg-blue-500/40 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {loading ? 'Getting Location...' : 'Get My Location'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="glass-light rounded-xl p-4 space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-300 mb-1">Address</h3>
                    <p className="text-white break-words">{location.display_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-300 mb-1">Coordinates</h3>
                    <p className="text-white">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-300 mb-1">Accuracy</h3>
                    <p className="text-white">{location.accuracy.toFixed(1)} meters</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('photo')}
                    className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('hobbies')}
                    className="flex-1 btn-primary rounded-xl py-3 font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'hobbies':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">Select Your Hobbies</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHobby}
                  onChange={(e) => setNewHobby(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHobby()}
                  placeholder="Enter your hobby"
                  className="flex-1 p-4 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500 backdrop-blur-sm text-lg transition-all hover:bg-gray-800/70"
                />
                <button
                  onClick={addHobby}
                  className="px-8 py-4 glass-primary rounded-xl font-medium text-lg backdrop-blur-sm hover:bg-blue-500/40 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {hobbies.map(hobby => (
                  <div
                    key={hobby}
                    className="flex items-center gap-2 glass-primary rounded-full px-4 py-2"
                  >
                    <span>{hobby}</span>
                    <button
                      onClick={() => removeHobby(hobby)}
                      className="text-white hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep('location')}
                className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep('aadhaar')}
                className="flex-1 btn-primary rounded-xl py-3 font-semibold"
                disabled={loading || hobbies.length === 0}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 'aadhaar':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">Aadhaar Verification</h2>
            <div className="space-y-4">
              {/* Aadhaar Number Section */}
              <div className="glass-light rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-4">
                  Your Aadhaar number is required for identity verification and will be kept secure.
                </p>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setAadhaarNumber(value);
                  }}
                  placeholder="Enter 12-digit Aadhaar number"
                  className="w-full p-4 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500 backdrop-blur-sm text-lg transition-all hover:bg-gray-800/70 text-center tracking-widest font-mono"
                  maxLength="12"
                />
                {aadhaarNumber && (
                  <div className="mt-2 text-center">
                    {validateAadhaar(aadhaarNumber) ? (
                      <span className="text-green-400 text-sm flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Valid Aadhaar number
                      </span>
                    ) : (
                      <span className="text-red-400 text-sm">
                        Please enter exactly 12 digits
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Aadhaar Photo Section */}
              <div className="glass-light rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Upload Aadhaar Card Photo</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Please upload a clear photo of your Aadhaar card for verification. Supported formats: JPG, PNG, WebP (max 5MB).
                </p>
                
                {!aadhaarPhotoPreview ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAadhaarFileUpload}
                      className="hidden"
                      id="aadhaar-upload"
                    />
                    <label
                      htmlFor="aadhaar-upload"
                      className="w-full btn-primary rounded-xl py-4 font-semibold text-lg backdrop-blur-sm bg-blue-500/30 hover:bg-blue-500/40 transition-all transform hover:scale-[1.02] shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose Aadhaar Photo
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img
                      src={aadhaarPhotoPreview}
                      alt="Aadhaar Card Preview"
                      className="w-full rounded-2xl max-h-64 object-contain bg-gray-800/30"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={removeAadhaarPhoto}
                        className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
                      >
                        Remove Photo
                      </button>
                      <label
                        htmlFor="aadhaar-upload"
                        className="flex-1 btn-secondary rounded-xl py-3 font-semibold cursor-pointer text-center"
                      >
                        Choose Different Photo
                      </label>
                      <span className="flex-1 flex items-center justify-center text-green-400 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Photo Selected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep('hobbies')}
                className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep('role')}
                className="flex-1 btn-primary rounded-xl py-3 font-semibold"
                disabled={loading || !validateAadhaar(aadhaarNumber) || !aadhaarPhotoFile}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 'role':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">Select Your Role</h2>
            <div className="space-y-4">
              <button
                onClick={() => setUserRole('elderly')}
                className={`w-full p-6 rounded-xl text-lg font-medium transition-all ${userRole === 'elderly' ? 'glass-primary' : 'glass-light'} flex items-center gap-4`}
              >
                <div className="p-3 rounded-full bg-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold">Elderly</h3>
                  <p className="text-sm text-gray-300 mt-1">I need assistance and support</p>
                </div>
                {userRole === 'elderly' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setUserRole('helper')}
                className={`w-full p-6 rounded-xl text-lg font-medium transition-all ${userRole === 'helper' ? 'glass-primary' : 'glass-light'} flex items-center gap-4`}
              >
                <div className="p-3 rounded-full bg-green-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold">Helper</h3>
                  <p className="text-sm text-gray-300 mt-1">I want to help and support others</p>
                </div>
                {userRole === 'helper' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setUserRole('admin')}
                className={`w-full p-6 rounded-xl text-lg font-medium transition-all ${userRole === 'admin' ? 'glass-primary' : 'glass-light'} flex items-center gap-4`}
              >
                <div className="p-3 rounded-full bg-purple-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold">Admin</h3>
                  <p className="text-sm text-gray-300 mt-1">I manage and oversee the platform</p>
                </div>
                {userRole === 'admin' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep('aadhaar')}
                className="flex-1 btn-secondary rounded-xl py-3 font-semibold"
              >
                Back
              </button>
              <button
                onClick={saveProfile}
                className="flex-1 btn-primary rounded-xl py-3 font-semibold"
                disabled={loading || !userRole}
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 relative">
      <div className="bg-animated">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
        <div className="blob b3"></div>
      </div>

      <div className="max-w-md mx-auto pt-8">
        {/* Progress Bar */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">Profile Setup</span>
            <span className="text-sm text-gray-300">{currentStepIndex + 1} of {steps.length}</span>
          </div>
          <div className="flex gap-2 mb-2">
            {steps.map((stepName, index) => (
              <div
                key={stepName}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStepIndex
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="text-center">
            <span className="text-sm font-medium gradient-text">
              {stepTitles[step]}
            </span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          {error && (
            <div className="glass-error rounded-xl p-4 mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}
          {renderStep()}
        </div>
      </div>
    </div>
  );
}