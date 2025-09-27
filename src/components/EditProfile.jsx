import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function EditProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Aadhaar photo state
  const [aadhaarPhotoFile, setAadhaarPhotoFile] = useState(null);
  const [aadhaarPhotoPreview, setAadhaarPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    hobbies: [],
    user_role: 'elderly',
    aadhaar_number: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Get auth provider info
      const signInProvider = authUser?.app_metadata?.provider || 'email';
      
      setProfile({ ...data, signInProvider });

      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        hobbies: data.hobbies || [],
        user_role: data.user_role || 'elderly',
        aadhaar_number: data.aadhaar_number || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  };

  // Aadhaar file upload helpers
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

  const saveAadhaarPhoto = async () => {
    if (!aadhaarPhotoFile) return;
    try {
      setLoading(true);
      const path = `${user.id}/${Date.now()}_aadhaar.${aadhaarPhotoFile.name.split('.').pop()}`;

      const { error: uploadErr } = await supabase.storage
        .from('aadhaar-documents')
        .upload(path, aadhaarPhotoFile, { contentType: aadhaarPhotoFile.type, cacheControl: '3600' });
      if (uploadErr) throw uploadErr;

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ aadhaar_card_photo: path })
        .eq('id', user.id);
      if (updErr) throw updErr;

      setSuccess('Aadhaar photo uploaded successfully!');
      setAadhaarPhotoFile(null);
      setAadhaarPhotoPreview(null);
      fetchProfile();
    } catch (err) {
      console.error('Aadhaar upload error:', err);
      setError('Failed to upload Aadhaar photo');
    } finally {
      setLoading(false);
    }
  };

  const removeAadhaarPhoto = () => {
    setAadhaarPhotoFile(null);
    setAadhaarPhotoPreview(null);
  };

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const photo = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoData(photo);
    
    // Stop camera immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const updatePhoto = async () => {
    if (!photoData) return;

    try {
      const base64Data = photoData.split(',')[1];
      const photoFile = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      const photoPath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(photoPath, photoFile, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: photoPath })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile photo updated successfully!');
      fetchProfile();
      setPhotoData(null);
    } catch (err) {
      console.error('Error updating photo:', err);
      setError('Failed to update photo');
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addHobby = (hobby) => {
    if (hobby.trim() && !formData.hobbies.includes(hobby.trim())) {
      setFormData({ ...formData, hobbies: [...formData.hobbies, hobby.trim()] });
    }
  };

  const removeHobby = (hobby) => {
    setFormData({ ...formData, hobbies: formData.hobbies.filter(h => h !== hobby) });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          const location = {
            latitude,
            longitude,
            display_name: data.display_name
          };

          const { error } = await supabase
            .from('profiles')
            .update({ 
              location,
              current_location: `${latitude},${longitude}`
            })
            .eq('id', user.id);

          if (error) throw error;
          setSuccess('Location updated successfully!');
          fetchProfile();
        } catch (err) {
          console.error('Location error:', err);
          setError('Failed to update location');
        }
      },
      (err) => setError('Failed to get location')
    );
  };

  if (!profile) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold gradient-text">Edit Profile</h2>

      {error && (
        <div className="glass-error rounded-xl p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Aadhaar Verification Section */}
      <div className="glass-light rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">Aadhaar Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-slate-300">Verification Status</span>
            <div className="flex items-center gap-2">
              {profile?.aadhaar_verified ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-green-400 text-sm">Verified</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span className="text-yellow-400 text-sm">Pending</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-slate-300">Photo</span>
            <div className="flex items-center gap-2">
              {profile?.aadhaar_card_photo ? (
                <>
                  <span className="text-green-400 text-sm">Uploaded</span>
                  <button
                    type="button"
                    className="btn-secondary rounded-xl px-3 py-1"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase
                          .storage
                          .from('aadhaar-documents')
                          .createSignedUrl(profile.aadhaar_card_photo, 60);
                        if (error) throw error;
                        window.open(data.signedUrl, '_blank');
                      } catch (e) {
                        setError('Unable to open preview');
                      }
                    }}
                  >
                    Preview
                  </button>
                  <label
                    htmlFor="aadhaar-file-input"
                    className="btn-primary rounded-xl px-3 py-1 cursor-pointer"
                  >
                    Replace
                  </label>
                </>
              ) : (
                <label
                  htmlFor="aadhaar-file-input"
                  className="btn-primary rounded-xl px-4 py-2 cursor-pointer"
                >
                  Upload Aadhaar Photo
                </label>
              )}
            </div>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleAadhaarFileUpload}
          className="hidden"
          id="aadhaar-file-input"
        />

        {aadhaarPhotoPreview && (
          <div className="mt-4">
            <img src={aadhaarPhotoPreview} alt="Aadhaar Preview" className="w-full max-w-md rounded-xl mb-3 object-contain bg-gray-800/30" />
            <div className="flex gap-3">
              <button type="button" className="btn-secondary rounded-xl px-4 py-2" onClick={removeAadhaarPhoto}>
                Discard
              </button>
              <button type="button" className="btn-primary rounded-xl px-4 py-2" disabled={loading} onClick={saveAadhaarPhoto}>
                {loading ? 'Saving...' : 'Save Aadhaar Photo'}
              </button>
            </div>
          </div>
        )}
      </div>


      {success && (
        <div className="glass-primary rounded-xl p-4">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Profile Photo Section */}
      <div className="glass-light rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          {profile.profile_photo && (
            <img
              src={`${supabase.storage.from('profile-photos').getPublicUrl(profile.profile_photo).data.publicUrl}`}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          )}
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowCamera(true);
                setupCamera();
              }}
              className="btn-primary rounded-xl px-4 py-2"
            >
              Take New Photo
            </button>
            {photoData && (
              <button
                onClick={updatePhoto}
                className="btn-secondary rounded-xl px-4 py-2 ml-2"
              >
                Save Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Take Photo</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-xl transform scale-x-[-1] mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCamera(false);
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                  }
                }}
                className="flex-1 btn-secondary rounded-xl py-3"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 btn-primary rounded-xl py-3"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className="glass-light rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">Account Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-slate-300">Email Status</span>
            <div className="flex items-center gap-2">
              {profile?.email ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-green-400 text-sm">Verified</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span className="text-red-400 text-sm">Not Verified</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-slate-300">Phone Status</span>
            <div className="flex items-center gap-2">
              {profile?.phone_verified ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-green-400 text-sm">Verified</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span className="text-red-400 text-sm">Not Verified</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-slate-300">Sign-in Provider</span>
            <div className="flex items-center gap-2">
              {profile?.signInProvider === 'google' ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-blue-400 text-sm">Google</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-400 text-sm">Email</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info Form */}
      <form onSubmit={updateProfile} className="space-y-6">
        <div className="glass-light rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Basic Information</h3>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Aadhaar Number (12 digits)"
              value={formData.aadhaar_number}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                setFormData({ ...formData, aadhaar_number: value });
              }}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              maxLength="12"
            />
            <select
              value={formData.user_role}
              onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="elderly">Elderly</option>
              <option value="helper">Helper</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Location Section */}
        <div className="glass-light rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Location</h3>
          {profile.location && (
            <p className="text-slate-400 text-sm mb-4">{profile.location.display_name}</p>
          )}
          <button
            type="button"
            onClick={getLocation}
            className="btn-primary rounded-xl px-4 py-2"
          >
            Update Location
          </button>
        </div>

        {/* Hobbies Section */}
        <div className="glass-light rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Hobbies</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.hobbies.map(hobby => (
              <div key={hobby} className="flex items-center gap-2 glass-primary rounded-full px-3 py-1">
                <span className="text-sm">{hobby}</span>
                <button
                  type="button"
                  onClick={() => removeHobby(hobby)}
                  className="text-white hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add hobby"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addHobby(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1 p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                addHobby(input.value);
                input.value = '';
              }}
              className="btn-primary rounded-xl px-4 py-3"
            >
              Add
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary rounded-xl py-3 font-semibold"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}
