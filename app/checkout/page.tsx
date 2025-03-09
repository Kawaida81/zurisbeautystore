'use client'

import { useCart } from '@/components/providers/cart-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, Info, Minus, Plus, CreditCard, Loader2, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FormErrors {
  cardNumber?: string
  expiry?: string
  cvv?: string
  firstName?: string
  lastName?: string
  postalCode?: string
  country?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, removeFromCart } = useCart()
  const [step] = useState(2)
  const totalSteps = 2
  const [isLoading, setIsLoading] = useState(false)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    Object.fromEntries(cartItems.map(item => [`${item.section}-${item.id}`, 1]))
  )
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('new')

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      router.push('/products')
    }
  }, [cartItems.length, router])

  // Saved payment methods (mock data)
  const savedPaymentMethods = [
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiry: '12/24'
    },
    {
      id: '2',
      type: 'mastercard',
      last4: '8888',
      expiry: '06/25'
    }
  ]

  // Calculate totals with quantities
  const subtotal = cartItems.reduce((sum, item) => {
    const quantity = quantities[`${item.section}-${item.id}`] || 1
    return sum + (item.price * quantity)
  }, 0)
  const tax = subtotal * 0.16 // 16% VAT
  const total = subtotal + tax

  const updateQuantity = (itemKey: string, delta: number) => {
    setQuantities(prev => {
      const newQuantity = Math.max(1, Math.min(10, (prev[itemKey] || 1) + delta)) // Cap at 10 items
      if (newQuantity === 10 && delta > 0) {
        toast.warning('Maximum quantity reached')
      }
      return { ...prev, [itemKey]: newQuantity }
    })
  }

  const handleRemoveItem = (item: any) => {
    removeFromCart(item.id, item.section)
    toast.success('Item removed from cart')
  }

  const validateForm = () => {
    const errors: FormErrors = {}
    
    if (selectedPaymentMethod === 'new') {
      const cardNumber = (document.getElementById('cardNumber') as HTMLInputElement)?.value
      const expiry = (document.getElementById('expiry') as HTMLInputElement)?.value
      const cvv = (document.getElementById('cvv') as HTMLInputElement)?.value
      
      if (!cardNumber || cardNumber.length < 16) {
        errors.cardNumber = 'Please enter a valid card number'
      }
      if (!expiry || !expiry.match(/^\d{2}\/\d{2}$/)) {
        errors.expiry = 'Please enter a valid expiry date (MM/YY)'
      }
      if (!cvv || cvv.length < 3) {
        errors.cvv = 'Please enter a valid CVV'
      }
    }

    const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value
    const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value
    const postalCode = (document.getElementById('postalCode') as HTMLInputElement)?.value
    const country = (document.getElementById('country') as HTMLSelectElement)?.value

    if (!firstName) errors.firstName = 'First name is required'
    if (!lastName) errors.lastName = 'Last name is required'
    if (!postalCode) errors.postalCode = 'Postal code is required'
    if (!country) errors.country = 'Please select a country'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCompleteOrder = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Order placed successfully!')
      // Here you would typically redirect to a success page
    } catch (error) {
      toast.error('Failed to process order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/products" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to products
            </Link>
            <div className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Payment Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-semibold mb-6">Enter payment info to complete order</h1>

              {/* Saved Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select payment method
                </label>
                <div className="space-y-3">
                  {savedPaymentMethods.map(method => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'border-[#FF6B6B] bg-[#FF6B6B]/5'
                          : 'border-gray-200 hover:border-[#FF6B6B]'
                      }`}
                    >
                      <CreditCard className={`h-5 w-5 mr-3 ${
                        selectedPaymentMethod === method.id ? 'text-[#FF6B6B]' : 'text-gray-400'
                      }`} />
                      <div className="flex-grow">
                        <p className="font-medium">{method.type.toUpperCase()} •••• {method.last4}</p>
                        <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => setSelectedPaymentMethod('new')}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'new'
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/5'
                        : 'border-gray-200 hover:border-[#FF6B6B]'
                    }`}
                  >
                    <Plus className={`h-5 w-5 mr-3 ${
                      selectedPaymentMethod === 'new' ? 'text-[#FF6B6B]' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">Add new card</span>
                  </div>
                </div>
              </div>

              {/* New Payment Method Form */}
              {selectedPaymentMethod === 'new' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card details
                  </label>
                  <div className="flex gap-2 mb-4">
                    <Image src="/images/visa.png" alt="Visa" width={40} height={25} className="object-contain" />
                    <Image src="/images/mastercard.png" alt="Mastercard" width={40} height={25} className="object-contain" />
                    <Image src="/images/amex.png" alt="American Express" width={40} height={25} className="object-contain" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="Card number"
                        className={`w-full ${formErrors.cardNumber ? 'border-red-500' : ''}`}
                      />
                      {formErrors.cardNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.cardNumber}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          id="expiry"
                          type="text"
                          placeholder="MM/YY"
                          className={formErrors.expiry ? 'border-red-500' : ''}
                        />
                        {formErrors.expiry && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.expiry}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="CVV"
                          className={formErrors.cvv ? 'border-red-500' : ''}
                        />
                        {formErrors.cvv && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      className={formErrors.firstName ? 'border-red-500' : ''}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      className={formErrors.lastName ? 'border-red-500' : ''}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="postalCode"
                      type="text"
                      placeholder="Postal code"
                      className={formErrors.postalCode ? 'border-red-500' : ''}
                    />
                    {formErrors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.postalCode}</p>
                    )}
                  </div>
                  <div>
                    <Select>
                      <SelectTrigger id="country" className={formErrors.country ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Country/Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ke">Kenya</SelectItem>
                        <SelectItem value="ug">Uganda</SelectItem>
                        <SelectItem value="tz">Tanzania</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.country && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.country}</p>
                    )}
                  </div>
                </div>
                <Input type="tel" placeholder="Phone number (optional)" />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Your cart</h2>
                  <span className="text-sm text-gray-500">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <Button asChild variant="outline">
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const itemKey = `${item.section}-${item.id}`
                      const quantity = quantities[itemKey] || 1
                      const itemTotal = item.price * quantity

                      return (
                        <div key={itemKey} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium truncate">{item.name}</h3>
                                <p className="text-sm text-gray-500">Ksh {item.price.toLocaleString()} each</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-500 -mt-1"
                                onClick={() => handleRemoveItem(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(itemKey, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(itemKey, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="font-medium">
                                Ksh {itemTotal.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Ksh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">VAT (16%)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Value Added Tax as per Kenyan law
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span>Ksh {tax.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="font-semibold">Order Total</span>
                      <span className="font-semibold">Ksh {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={handleCompleteOrder}
                  disabled={isLoading || cartItems.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Complete Order'
                  )}
                </Button>

                <p className="mt-4 text-xs text-gray-500 text-center">
                  By completing your order, you agree to our{' '}
                  <Link href="/terms" className="text-[#FF6B6B] hover:underline">
                    Terms of Use
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-[#FF6B6B] hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 