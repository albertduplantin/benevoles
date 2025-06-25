-- Script SQL corrigé pour le système de communication
-- Version simplifiée avec policies RLS moins restrictives

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Admins can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view active announcements for their role" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can manage their own reads" ON announcement_reads;

-- Policies simplifiées pour conversations
CREATE POLICY "Authenticated users can view all conversations" ON conversations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update conversations" ON conversations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies pour participants
CREATE POLICY "Authenticated users can view all participants" ON conversation_participants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their participation" ON conversation_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour messages
CREATE POLICY "Authenticated users can view all messages" ON messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Policies pour announcements
CREATE POLICY "Authenticated users can view all announcements" ON announcements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create announcements" ON announcements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own announcements" ON announcements
    FOR UPDATE USING (auth.uid() = created_by);

-- Policies pour announcement reads
CREATE POLICY "Authenticated users can view all reads" ON announcement_reads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own reads" ON announcement_reads
    FOR ALL USING (auth.uid() = user_id);

-- Donner les permissions nécessaires sur les tables
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON announcement_reads TO authenticated;

-- Donner les permissions sur les séquences
GRANT USAGE, SELECT ON SEQUENCE conversations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_participants_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE announcements_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE announcement_reads_id_seq TO authenticated; 