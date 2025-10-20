"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, AlertCircle } from "lucide-react";
import { useCreateFarm } from "@/hooks/useCreateFarm";
import { toast } from "sonner";

export function TokenizationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFarm = useCreateFarm();

  // Form matches contract createFarm parameters exactly
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fundingGoal: "",
    sharePrice: "",
    maxSupply: "",
    metaCID: "",
    deadline: "",
    minROI: "",
    maxROI: "",
  });

  const [errors, setErrors] = useState({
    consistency: "",
    deadline: "",
    roi: "",
  });

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate consistency: fundingGoal = sharePrice * maxSupply
  useEffect(() => {
    const { fundingGoal, sharePrice, maxSupply } = formData;

    if (fundingGoal && sharePrice && maxSupply) {
      const goal = Number(fundingGoal);
      const price = Number(sharePrice);
      const supply = Number(maxSupply);
      const calculated = price * supply;

      if (Math.abs(goal - calculated) > 0.01) {
        setErrors((prev) => ({
          ...prev,
          consistency: `Funding goal must equal share price × max supply (${calculated.toFixed(
            2
          )})`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, consistency: "" }));
      }
    }
  }, [formData.fundingGoal, formData.sharePrice, formData.maxSupply]);

  // Validate ROI range
  useEffect(() => {
    const { minROI, maxROI } = formData;

    if (minROI && maxROI) {
      const min = Number(minROI);
      const max = Number(maxROI);

      if (min >= max) {
        setErrors((prev) => ({
          ...prev,
          roi: "minROI must be less than maxROI",
        }));
      } else if (max > 100) {
        setErrors((prev) => ({
          ...prev,
          roi: "maxROI must be <= 100",
        }));
      } else {
        setErrors((prev) => ({ ...prev, roi: "" }));
      }
    }
  }, [formData.minROI, formData.maxROI]);

  // Validate deadline
  useEffect(() => {
    if (formData.deadline) {
      const deadlineTime = new Date(formData.deadline).getTime();
      const now = Date.now();

      if (deadlineTime <= now) {
        setErrors((prev) => ({
          ...prev,
          deadline: "Deadline must be in the future",
        }));
      } else {
        setErrors((prev) => ({ ...prev, deadline: "" }));
      }
    }
  }, [formData.deadline]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Final validation
      if (errors.consistency || errors.deadline || errors.roi) {
        toast.error("Please fix validation errors");
        setIsSubmitting(false);
        return;
      }

      // Validate all required fields
      if (
        !formData.name ||
        !formData.description ||
        !formData.fundingGoal ||
        !formData.sharePrice ||
        !formData.maxSupply ||
        !formData.deadline ||
        !formData.minROI ||
        !formData.maxROI
      ) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Convert deadline to Unix timestamp (seconds)
      const deadlineTimestamp = Math.floor(
        new Date(formData.deadline).getTime() / 1000
      );

      // Use placeholder CID if not provided
      const metaCID = formData.metaCID || `QmFarm${Date.now()}`;

      console.log("Submitting farm with params:", {
        name: formData.name,
        description: formData.description,
        fundingGoal: formData.fundingGoal,
        sharePrice: formData.sharePrice,
        maxSupply: formData.maxSupply,
        metaCID,
        deadline: deadlineTimestamp,
        minROI: Number(formData.minROI),
        maxROI: Number(formData.maxROI),
      });

      // Call createFarm hook
      const result = await createFarm({
        name: formData.name,
        description: formData.description,
        fundingGoal: formData.fundingGoal,
        sharePrice: formData.sharePrice,
        maxSupply: formData.maxSupply,
        metaCID,
        deadline: deadlineTimestamp,
        minROI: Number(formData.minROI),
        maxROI: Number(formData.maxROI),
      });

      if (result) {
        toast.success("Farm campaign created successfully! 🌾");

        // Reset form
        setFormData({
          name: "",
          description: "",
          fundingGoal: "",
          sharePrice: "",
          maxSupply: "",
          metaCID: "",
          deadline: "",
          minROI: "",
          maxROI: "",
        });
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate funding goal automatically
  const handleAutoCalculate = () => {
    const { sharePrice, maxSupply } = formData;
    if (sharePrice && maxSupply) {
      const calculated = (Number(sharePrice) * Number(maxSupply)).toString();
      setFormData((prev) => ({ ...prev, fundingGoal: calculated }));
    }
  };

  const hasErrors = errors.consistency || errors.deadline || errors.roi;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Create New Farm Campaign
          </CardTitle>
          <CardDescription>
            Enter exact parameters for your farm tokenization campaign
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateCampaign} className="space-y-6">
            {/* Farm Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Farm Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Organic Wheat Farm"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your farm project, location, crop type, practices..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Share Price */}
              <div className="space-y-2">
                <Label htmlFor="sharePrice">
                  Share Price (USDT) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sharePrice"
                  name="sharePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.sharePrice}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  required
                />
              </div>

              {/* Max Supply */}
              <div className="space-y-2">
                <Label htmlFor="maxSupply">
                  Max Supply (Shares) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxSupply"
                  name="maxSupply"
                  type="number"
                  min="1"
                  value={formData.maxSupply}
                  onChange={handleInputChange}
                  placeholder="e.g., 1000"
                  required
                />
              </div>

              {/* Funding Goal */}
              <div className="space-y-2">
                <Label htmlFor="fundingGoal">
                  Funding Goal (USDT) <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="fundingGoal"
                    name="fundingGoal"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.fundingGoal}
                    onChange={handleInputChange}
                    placeholder="Must = sharePrice × maxSupply"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoCalculate}
                    disabled={!formData.sharePrice || !formData.maxSupply}
                  >
                    Auto
                  </Button>
                </div>
                {errors.consistency && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.consistency}
                  </p>
                )}
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">
                  Deadline <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                />
                {errors.deadline && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.deadline}
                  </p>
                )}
              </div>

              {/* Min ROI */}
              <div className="space-y-2">
                <Label htmlFor="minROI">
                  Min ROI (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="minROI"
                  name="minROI"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.minROI}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  required
                />
              </div>

              {/* Max ROI */}
              <div className="space-y-2">
                <Label htmlFor="maxROI">
                  Max ROI (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxROI"
                  name="maxROI"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.maxROI}
                  onChange={handleInputChange}
                  placeholder="e.g., 25"
                  required
                />
                {errors.roi && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.roi}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata CID (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="metaCID">Metadata CID (IPFS - Optional)</Label>
              <Input
                id="metaCID"
                name="metaCID"
                value={formData.metaCID}
                onChange={handleInputChange}
                placeholder="e.g., QmXxx... (leave empty for auto-generated)"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate a placeholder CID
              </p>
            </div>

            {/* Image Upload Placeholder */}
            <div className="space-y-2">
              <Label htmlFor="images">Farm Images (Coming Soon)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center opacity-50">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  IPFS upload integration coming soon
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="gradient-primary text-white flex-1"
                disabled={isSubmitting || hasErrors}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Creating Campaign...
                  </>
                ) : (
                  "Create Farm Campaign 🌾"
                )}
              </Button>
            </div>

            <div className="text-xs text-center space-y-1">
              <p className="text-muted-foreground">* Required fields</p>
              {hasErrors && (
                <p className="text-red-500">
                  Please fix validation errors above
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
