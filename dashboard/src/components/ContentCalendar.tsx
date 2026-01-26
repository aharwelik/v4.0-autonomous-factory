"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  Send,
  Twitter,
  Linkedin,
  FileText,
  Image as ImageIcon,
  Heart,
  Repeat,
  MessageCircle
} from "lucide-react";

interface Engagement {
  likes: number;
  shares: number;
  comments: number;
}

interface ContentItem {
  id: string;
  platform: "twitter" | "linkedin" | "producthunt" | "blog";
  content: string;
  status: "scheduled" | "ready" | "posted";
  scheduledFor: string;
  image?: string;
  engagement?: Engagement;
}

interface ContentCalendarProps {
  content: ContentItem[];
}

const platforms = {
  twitter: { icon: Twitter, label: "Twitter", color: "bg-black" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "bg-blue-700" },
  producthunt: { icon: Send, label: "ProductHunt", color: "bg-orange-500" },
  blog: { icon: FileText, label: "Blog", color: "bg-gray-500" },
};

interface ContentCardProps {
  item: ContentItem;
  showEngagement?: boolean;
}

function ContentCard({ item, showEngagement }: ContentCardProps) {
  const platform = platforms[item.platform];
  const Icon = platform.icon;

  return (
    <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Badge className={`${platform.color} text-white`}>
          <Icon className="w-3 h-3 mr-1" />
          {platform.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(item.scheduledFor).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm line-clamp-3">{item.content}</p>
      {item.image && (
        <div className="mt-2 relative">
          <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      )}
      {showEngagement && item.engagement && (
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {item.engagement.likes}
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="w-3 h-3" /> {item.engagement.shares}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> {item.engagement.comments}
          </span>
        </div>
      )}
    </div>
  );
}

export function ContentCalendar({ content }: ContentCalendarProps) {
  const [filter, setFilter] = useState<"all" | "twitter" | "linkedin" | "producthunt" | "blog">("all");

  const filteredContent =
    filter === "all" ? content : content.filter((c) => c.platform === filter);

  const scheduled = filteredContent.filter((c) => c.status === "scheduled");
  const ready = filteredContent.filter((c) => c.status === "ready");
  const posted = filteredContent.filter((c) => c.status === "posted");

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "default" : "outline"}
        >
          All
        </Button>
        {Object.entries(platforms).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <Button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              variant={filter === key ? "default" : "outline"}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {val.label}
            </Button>
          );
        })}
      </div>

      {/* Content Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheduled */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduled
              <Badge variant="secondary" className="ml-auto">
                {scheduled.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduled.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No scheduled content
              </div>
            ) : (
              scheduled.map((item) => <ContentCard key={item.id} item={item} />)
            )}
          </CardContent>
        </Card>

        {/* Ready to Post */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Ready to Post
              <Badge variant="secondary" className="ml-auto">
                {ready.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ready.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No content ready
              </div>
            ) : (
              ready.map((item) => <ContentCard key={item.id} item={item} />)
            )}
          </CardContent>
        </Card>

        {/* Posted */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              Posted
              <Badge variant="secondary" className="ml-auto">
                {posted.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {posted.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No posted content yet
              </div>
            ) : (
              posted.map((item) => (
                <ContentCard key={item.id} item={item} showEngagement />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate New Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button className="gap-2">
              <Twitter className="w-4 h-4" />
              Generate Twitter Thread
            </Button>
            <Button variant="secondary" className="gap-2">
              <Linkedin className="w-4 h-4" />
              Generate LinkedIn Post
            </Button>
            <Button variant="secondary" className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Blog Post
            </Button>
            <Button variant="secondary" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Generate Images
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
