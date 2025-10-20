"use client"

import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, Calendar, ShoppingCart, Award } from "lucide-react"
import { useState } from "react"
import { usePurchase } from "@/hooks/usePurchase"


interface ProductModalProps {
  product: {
    id: number
    name: string
    category: string
    farm: string
    location: string
    price: number
    unit: string
    quantity: number
    image: string
    description: string
    harvestDate: string
    certification: string
  }
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {

  const purchase = usePurchase();
  
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

   const handlePurchase = async (): Promise<void> => {
      if (!quantity) {
        alert("Please enter a valid amount");
        return;
      }

      setIsPurchasing(true);
      try {
        await purchase(String(quantity));
        setQuantity(1);
      } catch (error) {
        console.error("Purchase failed:", error);
      } finally {
        setIsPurchasing(false);
      }
    };
  

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">{product.name}</DialogTitle>
            <DialogDescription>From {product.farm}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Product Image */}
            <div className="relative h-64 rounded-lg overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm">
                  <Award className="h-3 w-3 mr-1" />
                  {product.certification}
                </Badge>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{product.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Harvest Date:</span>
                    <span className="font-medium">{new Date(product.harvestDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-medium">{product.quantity} units</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-lg bg-muted/50 space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">${product.price}</div>
                    <div className="text-sm text-muted-foreground">{product.unit}</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Math.min(product.quantity, Number.parseInt(e.target.value) || 1)))
                      }
                    />
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">${(product.price * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Blockchain Fee:</span>
                      <span className="font-semibold">$2.50</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-emerald-600">${(product.price * quantity + 2.5).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full gradient-primary text-white"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isPurchasing ? "Processing..." : "Purchase Now"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
