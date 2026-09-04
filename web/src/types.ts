export type ProfileType = 'piloto' | 'oficina'
export type Drivetrain = 'dianteira' | 'traseira' | '4x4'
export type Aspiration = 'aspirado' | 'turbo' | 'supercharger' | 'turbo+supercharger' | 'eletrico'
export type Suspension = 'original' | 'coilover' | 'a ar' | 'rebaixamento fixo' | 'competicao'
export type BuildStatus = 'original' | 'em construcao' | 'pronto para pista' | 'show car'
export type ModCategory =
  | 'motor'
  | 'suspensao'
  | 'freios'
  | 'rodas'
  | 'aerodinamica'
  | 'seguranca'
  | 'eletronica'

export interface Profile {
  id: string
  username: string
  displayName: string
  type: ProfileType
  avatarUrl: string | null
  bio: string | null
  city: string | null
  state: string | null
  memberNumber: number
  isVerified: boolean
  specialties: string[]
  address: string | null
  createdAt: string
}

export interface PublicProfile extends Profile {
  carsCount: number
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isMe: boolean
}

export interface CarMod {
  id: string
  category: ModCategory
  label: string
}

export interface Car {
  id: string
  ownerId: string
  nickname: string
  brand: string
  model: string
  year: number
  drivetrain: Drivetrain
  aspiration: Aspiration
  engine: string | null
  displacement: string | null
  gearbox: string | null
  suspension: Suspension
  suspensionDetail: string | null
  wheels: string | null
  tires: string | null
  brakes: string | null
  hp: number | null
  whp: number | null
  torqueKgfm: number | null
  boostBar: number | null
  fuel: string | null
  ecu: string | null
  stage: string | null
  buildStatus: BuildStatus
  isPrimary: boolean
  coverUrl: string | null
  createdAt: string
  mods: CarMod[]
}

export interface DiscoverCar {
  id: string
  nickname: string
  brand: string
  model: string
  year: number
  drivetrain: Drivetrain
  aspiration: Aspiration
  engine: string | null
  gearbox: string | null
  hp: number | null
  whp: number | null
  tires: string | null
  stage: string | null
  coverUrl: string | null
  mods: CarMod[]
  owner: { username: string; displayName: string; city: string | null; state: string | null }
}

export interface PostAuthor {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  type: ProfileType
  isVerified: boolean
}

export interface PostCarSummary {
  id: string
  nickname: string
  brand: string
  model: string
  whp: number | null
  stage: string | null
  dynoCertified: boolean
}

export interface Post {
  id: string
  caption: string | null
  location: string | null
  createdAt: string
  author: PostAuthor
  car: PostCarSummary | null
  media: { url: string; position: number }[]
  likesCount: number
  commentsCount: number
  likedByMe: boolean
}

export interface Comment {
  id: string
  body: string
  parentId: string | null
  createdAt: string
  author: { username: string; displayName: string; avatarUrl: string | null }
}

export interface AppNotification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'match' | 'dyno_homologado' | 'lap_record'
  entityId: string | null
  read: boolean
  createdAt: string
  actor: { username: string; displayName: string; avatarUrl: string | null } | null
}

export interface SessionUser {
  id: string
  email: string
  onboarded: boolean
  profile: Profile | null
}
