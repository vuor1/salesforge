-- CreateTable
CREATE TABLE "ProjectCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "callAngle" TEXT,
    "callHistorySummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallStory" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "projectCardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerSupportRequest" (
    "id" TEXT NOT NULL,
    "projectCardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adviceType" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerSupportAnswer" (
    "id" TEXT NOT NULL,
    "peerSupportRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerSupportAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CallStory" ADD CONSTRAINT "CallStory_projectCardId_fkey" FOREIGN KEY ("projectCardId") REFERENCES "ProjectCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallStory" ADD CONSTRAINT "CallStory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerSupportRequest" ADD CONSTRAINT "PeerSupportRequest_projectCardId_fkey" FOREIGN KEY ("projectCardId") REFERENCES "ProjectCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerSupportRequest" ADD CONSTRAINT "PeerSupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerSupportAnswer" ADD CONSTRAINT "PeerSupportAnswer_peerSupportRequestId_fkey" FOREIGN KEY ("peerSupportRequestId") REFERENCES "PeerSupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerSupportAnswer" ADD CONSTRAINT "PeerSupportAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
