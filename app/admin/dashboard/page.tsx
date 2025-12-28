"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Edit, Trash2, X, Check, Users, Trophy } from "lucide-react";
import {
  getClubByAdminId,
  createClub,
  updateClub,
  getPlayersByClubId,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "@/lib/firebase/db";
import { Club, Player } from "@/lib/types";

export default function ClubAdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingClubName, setEditingClubName] = useState(false);
  const [clubName, setClubName] = useState("");
  const [isSavingClub, setIsSavingClub] = useState(false);
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPoints, setNewPlayerPoints] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [adminId] = useState(() => {
    // Get admin ID from sessionStorage or use a default
    // For now, we'll use a consistent admin ID since all admins use the same login
    // In the future, this could be tied to a specific user account
    if (typeof window !== "undefined") {
      let id = sessionStorage.getItem("adminId");
      if (!id) {
        // Use a consistent ID for now - in production this would come from user auth
        id = "club_admin_1";
        sessionStorage.setItem("adminId", id);
      }
      return id;
    }
    return "club_admin_1";
  });

  useEffect(() => {
    // Check authentication
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.push("/book");
    } else {
      setIsAuthenticated(true);
      loadClubAndPlayers();
    }
  }, [router]);

  const loadClubAndPlayers = async () => {
    try {
      setLoading(true);
      // Try to get existing club for this admin
      let existingClub = await getClubByAdminId(adminId);
      
      if (!existingClub) {
        // Create a new club if one doesn't exist
        const clubId = await createClub({
          name: "My Club",
          adminId,
        });
        existingClub = await getClubByAdminId(adminId);
      }
      
      if (existingClub) {
        setClub(existingClub);
        setClubName(existingClub.name);
        
        // Load players for this club
        const clubPlayers = await getPlayersByClubId(existingClub.id);
        setPlayers(clubPlayers);
      }
    } catch (error) {
      console.error("Error loading club:", error);
      setSaveMessage("Error loading club data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClubName = async () => {
    if (!club || !clubName.trim()) return;
    
    try {
      setIsSavingClub(true);
      await updateClub(club.id, { name: clubName.trim() });
      setClub({ ...club, name: clubName.trim() });
      setEditingClubName(false);
      setSaveMessage("Club name updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error updating club name:", error);
      setSaveMessage("Error updating club name. Please try again.");
    } finally {
      setIsSavingClub(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!club || !newPlayerName.trim()) return;
    
    try {
      setIsSavingPlayer(true);
      const points = parseInt(newPlayerPoints) || 0;
      await createPlayer({
        name: newPlayerName.trim(),
        points,
        clubId: club.id,
      });
      setNewPlayerName("");
      setNewPlayerPoints("");
      setShowAddPlayer(false);
      await loadClubAndPlayers();
      setSaveMessage("Player added successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error adding player:", error);
      setSaveMessage("Error adding player. Please try again.");
    } finally {
      setIsSavingPlayer(false);
    }
  };

  const handleUpdatePlayer = async (player: Player, name: string, points: number) => {
    try {
      setIsSavingPlayer(true);
      await updatePlayer(player.id, {
        name: name.trim(),
        points,
      });
      await loadClubAndPlayers();
      setEditingPlayerId(null);
      setSaveMessage("Player updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error updating player:", error);
      setSaveMessage("Error updating player. Please try again.");
    } finally {
      setIsSavingPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;
    
    try {
      setIsSavingPlayer(true);
      await deletePlayer(playerId);
      await loadClubAndPlayers();
      setSaveMessage("Player deleted successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting player:", error);
      setSaveMessage("Error deleting player. Please try again.");
    } finally {
      setIsSavingPlayer(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-earth-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-earth-600">Loading club data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/book")}
              className="flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-primary-800 flex-1">Club Management</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/payment-settings"
                className="text-primary-700 hover:text-primary-800 font-medium text-sm underline"
              >
                Payment Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.includes("Error")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Club Name Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Users className="h-6 w-6 text-primary-700" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-earth-700 mb-2">
                Club Name
              </label>
              {editingClubName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isSavingClub}
                  />
                  <button
                    onClick={handleSaveClubName}
                    disabled={isSavingClub || !clubName.trim()}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingClubName(false);
                      setClubName(club?.name || "");
                    }}
                    disabled={isSavingClub}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-primary-800">{club?.name}</h2>
                  <button
                    onClick={() => setEditingClubName(true)}
                    className="p-2 text-primary-700 hover:bg-primary-50 rounded-lg"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary-700" />
              <h2 className="text-xl font-bold text-primary-800">Players</h2>
              <span className="text-sm text-earth-600">({players.length})</span>
            </div>
            {!showAddPlayer && (
              <button
                onClick={() => setShowAddPlayer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Player
              </button>
            )}
          </div>

          {/* Add Player Form */}
          {showAddPlayer && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={newPlayerPoints}
                    onChange={(e) => setNewPlayerPoints(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleAddPlayer}
                    disabled={isSavingPlayer || !newPlayerName.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSavingPlayer ? "Saving..." : "Add"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPlayer(false);
                      setNewPlayerName("");
                      setNewPlayerPoints("");
                    }}
                    disabled={isSavingPlayer}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Players List */}
          {players.length === 0 ? (
            <div className="text-center py-12 text-earth-600">
              <Users className="h-12 w-12 mx-auto mb-4 text-earth-400" />
              <p>No players yet. Add your first player to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isEditing={editingPlayerId === player.id}
                  onEdit={() => setEditingPlayerId(player.id)}
                  onCancel={() => setEditingPlayerId(null)}
                  onSave={handleUpdatePlayer}
                  onDelete={handleDeletePlayer}
                  isSaving={isSavingPlayer}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface PlayerRowProps {
  player: Player;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (player: Player, name: string, points: number) => void;
  onDelete: (playerId: string) => void;
  isSaving: boolean;
}

function PlayerRow({
  player,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  isSaving,
}: PlayerRowProps) {
  const [name, setName] = useState(player.name);
  const [points, setPoints] = useState(player.points.toString());

  useEffect(() => {
    if (isEditing) {
      setName(player.name);
      setPoints(player.points.toString());
    }
  }, [isEditing, player]);

  const handleSave = () => {
    const pointsNum = parseInt(points) || 0;
    onSave(player, name, pointsNum);
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Points
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSaving}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-primary-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-primary-800">{player.name}</h3>
              <p className="text-sm text-earth-600">Points: {player.points}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-primary-700 hover:bg-primary-50 rounded-lg"
            title="Edit player"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(player.id)}
            className="p-2 text-red-700 hover:bg-red-50 rounded-lg"
            title="Delete player"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
