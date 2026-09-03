export type ProfileType = 'piloto' | 'oficina'

export type Drivetrain = 'dianteira' | 'traseira' | '4x4'

export type Aspiration = 'aspirado' | 'turbo' | 'supercharger' | 'turbo+supercharger' | 'eletrico'

export type SuspensionType =
  | 'de fábrica'
  | 'coilover'
  | 'a ar'
  | 'rebaixamento fixo'
  | 'competição'

export interface Profile {
  id: string
  username: string
  displayName: string
  type: ProfileType
  avatarUrl: string
  bio: string
  location: string
  followersCount: number
  followingCount: number
  carsCount: number
  verified?: boolean
  specialties?: string[] // used by 'oficina' profiles, e.g. "Turbo", "Suspensão", "Dyno"
}

export interface CarSpec {
  drivetrain: Drivetrain
  aspiration: Aspiration
  suspension: SuspensionType
  wheels: string
  tires: string
  hp: number
  whp: number
}

export interface Car {
  id: string
  ownerId: string
  name: string
  brand: string
  model: string
  year: number
  coverPhotoUrl: string
  spec: CarSpec
  buildStage: 'stock' | 'em construção' | 'pronto para pista' | 'show car'
}

export interface Post {
  id: string
  authorId: string
  carId: string
  photoUrls: string[]
  caption: string
  createdAt: string
  likesCount: number
  commentsCount: number
  likedByMe?: boolean
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  text: string
  createdAt: string
}
