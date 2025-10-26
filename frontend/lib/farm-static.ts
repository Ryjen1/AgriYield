export interface Farm {
  id: string
  name: string
  farmer: string
  cropType: string
  image: string
  duration: string
  roi: number
  location: string
  city: string
  state: string
  fundingGoal: number
  amountRaised: number
  fundingProgress: number
  minInvestment: number
  description: string
  coordinates: [number, number]
  verified: boolean
  investors: number
}

// Server-safe static list for SSG. Keep empty to avoid build errors.
export const farms: Farm[] = []