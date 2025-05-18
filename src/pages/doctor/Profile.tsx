
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Shield, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  clinic_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  license_number: string;
  gst_number?: string;
  specialization?: string;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [formData, setFormData] = useState<DoctorProfile | null>(null);
  
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        
        // Transform data to match DoctorProfile interface with defaults for potentially missing fields
        const profileData: DoctorProfile = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          clinic_name: data.clinic_name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          license_number: data.license_number || '',
          gst_number: data.gst_number || '',
          specialization: data.specialization || '',
          is_approved: data.is_approved,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setDoctorProfile(profileData);
        setFormData(profileData);
      } catch (error: any) {
        console.error("Error fetching doctor profile:", error);
        toast.error("Failed to load profile", {
          description: error.message || "Please try again"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDoctorProfile();
  }, [user?.id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !user?.id) return;
    
    try {
      setIsSaving(true);
      
      // Only update the fields that are allowed to be changed
      const { data, error } = await supabase
        .from("doctors")
        .update({
          phone: formData.phone,
          clinic_name: formData.clinic_name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          specialization: formData.specialization
        })
        .eq("id", user.id)
        .select();
        
      if (error) throw error;
      
      if (data && data[0]) {
        // Transform the response data to match our DoctorProfile interface
        const updatedProfile: DoctorProfile = {
          ...doctorProfile!,
          phone: data[0].phone || '',
          clinic_name: data[0].clinic_name || '',
          address: data[0].address || '',
          city: data[0].city || '',
          state: data[0].state || '',
          pincode: data[0].pincode || '',
          specialization: data[0].specialization || '',
        };
        
        setDoctorProfile(updatedProfile);
      }
      
      toast.success("Profile Updated", {
        description: "Your profile has been successfully updated"
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Update Failed", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        </div>
      </Layout>
    );
  }
  
  if (!doctorProfile) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600">Profile not found. Please contact support.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Personal Information</TabsTrigger>
            <TabsTrigger value="address">Address & Contact</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-upkar-blue" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Manage your personal information
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData?.name || ""}
                        onChange={handleChange}
                        disabled
                      />
                      <p className="text-xs text-gray-500">Name cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData?.email || ""}
                        disabled
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData?.phone || ""}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        name="specialization"
                        value={formData?.specialization || ""}
                        onChange={handleChange}
                        placeholder="E.g. Cardiology, General Medicine"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-upkar-blue" />
                  Address & Contact Information
                </CardTitle>
                <CardDescription>
                  Update your clinic address and contact details
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Clinic Name</Label>
                    <Input
                      id="clinic_name"
                      name="clinic_name"
                      value={formData?.clinic_name || ""}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData?.address || ""}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData?.city || ""}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData?.state || ""}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData?.pincode || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-upkar-blue" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  View your professional and verification details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData?.license_number || ""}
                      disabled
                    />
                    <p className="text-xs text-gray-500">License number cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input
                      id="gst_number"
                      name="gst_number"
                      value={formData?.gst_number || ""}
                      disabled
                    />
                    <p className="text-xs text-gray-500">GST number cannot be changed</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    To update your license or GST information, please contact our support team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
