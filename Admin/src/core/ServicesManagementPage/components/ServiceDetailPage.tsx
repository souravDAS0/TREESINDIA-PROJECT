"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  MapPin,
  Clock,
  Calendar,
  Image as ImageIcon,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  IndianRupee,
} from "lucide-react";
import {
  Service,
  Category,
  Subcategory,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../types";
import { apiClient } from "@/lib/api-client";
import Button from "@/components/Button/Base/Button";
import Badge from "@/components/Badge/Badge";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { ServiceModal } from "./ServiceModal";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";

interface ServiceDetailPageProps {
  serviceId: string;
}

export default function ServiceDetailPage({
  serviceId,
}: ServiceDetailPageProps) {
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    loadService();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get(`/services/${serviceId}`);
      const serviceData = response.data.data;
      setService(serviceData);

      // Load subcategories for the service's category
      if (serviceData && serviceData.category_id) {
        await loadSubcategories(serviceData.category_id);
      }

      setIsDataReady(true);
      console.log(
        "Data ready - Service:",
        serviceData,
        "Categories:",
        categories.length,
        "Subcategories:",
        subcategories.length
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load service");
      toast.error("Error loading service");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await apiClient.get("/categories");
      const categoriesData = response.data.data || [];
      setCategories(categoriesData);
      console.log("Categories loaded:", categoriesData);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    try {
      setIsLoadingSubcategories(true);
      const response = await apiClient.get(
        `/subcategories/category/${categoryId}`
      );
      const subcategoriesData = response.data.data || [];
      setSubcategories(subcategoriesData);
      console.log(
        "Subcategories loaded for category",
        categoryId,
        ":",
        subcategoriesData
      );
    } catch (err) {
      console.error("Failed to load subcategories:", err);
      setSubcategories([]);
    } finally {
      setIsLoadingSubcategories(false);
    }
  };

  const handleUpdateService = async (
    data: CreateServiceRequest | UpdateServiceRequest,
    imageFiles?: File[]
  ) => {
    if (!service) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Add basic fields
      const name = data.name || service.name;
      const description = data.description || service.description || "";
      const priceType = data.price_type || service.price_type;
      const categoryId = data.category_id || service.category_id;
      const subcategoryId = data.subcategory_id || service.subcategory_id;
      const isActive =
        data.is_active !== undefined ? data.is_active : service.is_active;

      formData.append("name", name || "");
      formData.append("description", description || "");
      formData.append("price_type", priceType);

      if (data.price !== undefined && data.price !== null) {
        formData.append("price", data.price.toString());
      }
      formData.append("category_id", categoryId?.toString() || "0");
      formData.append("subcategory_id", subcategoryId?.toString() || "0");
      formData.append("is_active", isActive?.toString() || "true");

      // Add images
      if (imageFiles) {
        imageFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      await apiClient.put(`/admin/services/${service.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Service updated successfully");
      setIsEditModalOpen(false);
      loadService(); // Reload the service data
    } catch (err) {
      console.error("Failed to update service", err);
      toast.error("Failed to update service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!service) return;

    try {
      setIsToggling(true);
      await apiClient.patch(`/admin/services/${service.id}/status`, {});
      setService((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );
      toast.success(
        `Service ${
          service.is_active ? "deactivated" : "activated"
        } successfully`
      );
    } catch (err) {
      console.error("Failed to update service status", err);
      toast.error("Failed to update service status");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;

    try {
      await apiClient.delete(`/services/${service.id}`);
      toast.success("Service deleted successfully");
      router.push("/dashboard/services");
    } catch (err) {
      console.error("Failed to delete service", err);
      toast.error("Failed to delete service");
    }
  };

  const formatPrice = (price: number | undefined, priceType: string) => {
    if (priceType === "inquiry") {
      return "Inquiry Based";
    }
    if (price === undefined || price === null) {
      return "N/A";
    }
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading || !isDataReady) {
    return <Loader fullScreen />;
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Service Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          {error || "The service you're looking for doesn't exist."}
        </p>
        <Button
          variant="primary"
          onClick={() => router.push("/dashboard/services")}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Services
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.push("/dashboard/services")}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {service.name}
              </h1>
              <p className="text-sm text-gray-600">
                Created on {formatDate(service.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isDataReady && service) {
                  // Ensure subcategories are loaded for the current service's category
                  if (service.category_id && subcategories.length === 0) {
                    await loadSubcategories(service.category_id);
                  }
                  setIsEditModalOpen(true);
                } else {
                  toast.error("Please wait for data to load completely");
                }
              }}
              leftIcon={<Edit size={16} />}
              disabled={!isDataReady}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 size={16} />}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">
                        {service.category?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Subcategory</p>
                      <p className="font-medium">
                        {service.subcategory?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Price Type</p>
                      <p className="font-medium capitalize">
                        {service.price_type === "fixed"
                          ? "Fixed Price"
                          : "Inquiry Based"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-medium">
                        {formatPrice(service.price, service.price_type)}
                      </p>
                    </div>
                  </div>
                  {service.duration && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{service.duration}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">
                        {formatDate(service.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Images */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Service Images
                </h2>
                {service.images && service.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {service.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`${service.name} - Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                              <div class="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                            `;
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500">No images available</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {service.description && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              )}

              {/* Service Areas */}
              {service.service_areas && service.service_areas.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Service Areas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.service_areas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <MapPin size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          {area.city}, {area.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Management */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Status Management
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Current Status
                    </span>
                    <Badge
                      variant={service.is_active ? "success" : "secondary"}
                    >
                      {service.is_active ? (
                        <>
                          <CheckCircle size={14} className="mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isToggling}
                    className="w-full"
                    leftIcon={
                      service.is_active ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )
                    }
                  >
                    {isToggling
                      ? "Updating..."
                      : service.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (isDataReady && service) {
                        // Ensure subcategories are loaded for the current service's category
                        if (service.category_id && subcategories.length === 0) {
                          await loadSubcategories(service.category_id);
                        }
                        setIsEditModalOpen(true);
                      } else {
                        toast.error("Please wait for data to load completely");
                      }
                    }}
                    className="w-full"
                    leftIcon={<Edit size={16} />}
                    disabled={!isDataReady}
                  >
                    Edit Service
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/services")}
                    className="w-full"
                    leftIcon={<ArrowLeft size={16} />}
                  >
                    Back to Services
                  </Button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Timestamps
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">Created</div>
                      <div className="text-gray-900">
                        {formatDate(service.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">Last Updated</div>
                      <div className="text-gray-900">
                        {formatDate(service.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Service Modal */}
      <ServiceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        service={service}
        categories={categories}
        subcategories={subcategories}
        onSubmit={handleUpdateService}
        isLoading={
          isSubmitting || isLoadingCategories || isLoadingSubcategories
        }
        onCategoryChange={(categoryId: number) => {
          console.log("Category changed to:", categoryId);
          loadSubcategories(categoryId);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${service.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
